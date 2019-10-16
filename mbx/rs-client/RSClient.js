
/**
 * 
 * RSClient.js JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php) 
 *
 * Provides a RSClient class encapsulating REST jQuery ajax operations for a given URL
 *
 * Usage..
 * 
 * var client = new mbx.RSClient("http://my-url/somewhere/resourceType", 
 *   { success:function(){
 *      //default success callback for jQuery ajax call
 *   }, 
 *   fail:function(){
 *      //default fail callback for jQuery ajax call
 *   } 
 * });
 * 
 * client.create(newResource, successCallback, failCallback);
 * client.read(id, successCallback, failCallback);
 * client.find(queryParams, successCallback, failCallback);
 * client.update(id, updatedResource, successCallback, failCallback);
 * client.delete(id_or_queryParams, query, successCallback, failCallback);
 * 
 */
(function($){


if(typeof window.jQuery==="undefined") {
  throw "ERROR: RSClient couldn't find dependency: jQuery";
}


var defaultAjaxSettings = {
	contentType:"application/json"
};


var RSClient = function(url, defaultSettings){
  this.url = url;
//  if(this.url.length>=1 && this.url.charAt(this.url.length-1)=="/") {
//    this.url = this.url.substring(0, this.url.length-1); //chop off trailing / if present
//  }
  this.defaultSettings = defaultSettings || {};
  this.success = defaultSettings.success || function(data, statusString, jqXHR){};
  this.fail = defaultSettings.fail || function(jqXHR, statusString, errorString){};
  
   this.logger = {
      //error  debug   warn   log      info
      E:false,D:false,W:false,L:false,I:false,
      error:function(msg, obj){if(msg)console.error(msg);},
      warn:function(msg, obj){if(msg)console.warn(msg);},
      debug:function(msg, obj){if(msg)console.log(msg);}
    };
    if(CTX && CTX.TYPE.LogHandler && CTX.LOG instanceof CTX.TYPE.LogHandler) {
      this.logger = CTX.LOG.add('RSClient_'+this.url); //logger added for each new Message instance created
      this.logger.on().debug(true);
    }
}
//statics
RSClient.METHOD = {
	GET:"GET", PUT:"PUT", POST:"POST", DELETE:"DELETE"
}

//new instance prototype common functions
RSClient.prototype.applyDefaultSettingsTo = function(obj){
	var self=this;
	for(var p in defaultAjaxSettings) { //apply built in defaults
    if(!obj.hasOwnProperty(p))
      obj[p] = defaultAjaxSettings[p];
	}
	for(var p in self.defaultSettings) { //apply settings given in RSClient constructor
    if(!obj.hasOwnProperty(p))
	    obj[p] = self.defaultSettings[p];	  
	}
	
	 if(typeof obj.error == "function") {
    obj._error = obj.error; 
    obj.error = function(jqXHR, statusString, errorString) {
      if(typeof obj._error == "function") {
        var message = errorString;
        try {
          message = JSON.parse(jqXHR.responseText).message;
        } catch(e){
          self.logger.warn(self.logger.W && "Error parsing JSON error response", e);
        }
        obj._error(jqXHR, statusString, message);
      }
    }
  }
}

//Method specific functions all delegate to this one
RSClient.prototype.call = function(method, data, successFn, failFn){
	var self = this;
    var cfg = {
		method: method || RSClient.METHOD.GET,
		success: function(data, statusString, jqXHR){
			if(data && data.errorCode) {
				cfg.fail(jqXHR, String(data.errorCode), data.message || "Server Error");
			}
			else if(successFn) {
				successFn(data, statusString, jqXHR);
			}
			else {
				self.success(data, statusString, jqXHR);
			}
		},
		fail: failFn || self.fail
	}
	self.applyDefaultSettingsTo(cfg);
	
	var url = self.url;
	if(data.id) {
	  url = url + '/' + data.id;
	}
	
	if([RSClient.METHOD.GET, RSClient.METHOD.DELETE].indexOf(method)!=-1 && data.query) {
	  cfg.data = data.query; //jQuery adds as query params by default
	}	
  else if([RSClient.METHOD.PUT, RSClient.METHOD.POST].indexOf(method)!=-1 && data.resource) {
    cfg.data = JSON.stringify(data.resource);
  }
    
  self.logger.debug(self.logger.D && method+" "+url, cfg.data);
		
	var jqXHR = $.ajax(url, cfg);
	return jqXHR;
}

RSClient.prototype.create = function(resource, successFn, failFn){
    if(!resource) {
      throw "RSClient.create call for '"+this.url+"' is missing new resource object"
    }
	return this.call(RSClient.METHOD.POST, {resource: resource}, successFn, failFn);
}

RSClient.prototype.update = function(id, resource, successFn, failFn){
    if(!id) {
      throw "RSClient.update call for '"+this.url+"' is missing resource id"
    }
    if(!resource) {
      throw "RSClient.update call for '"+this.url+"' is missing updated resource object"
    }
	  return this.call(RSClient.METHOD.PUT, {id:id, resource:resource},successFn, failFn);
}

RSClient.prototype.read = function(id, successFn, failFn){
	  if(typeof id==="undefined" || id==null) {
	    throw "RSClient.read call for '"+this.url+"' is missing resource id"
	  }
    return this.call(RSClient.METHOD.GET, {id:id}, successFn, failFn);
}

RSClient.prototype["delete"] = function(id_or_query, successFn, failFn){
  if(typeof id_or_query==="undefined" || id_or_query==null) {
    throw "RSClient.delete call for '"+this.url+"' is missing resource id or query object"
  }
  if(typeof id_or_query=="object")
	   return this.call(RSClient.METHOD.DELETE, {query:id_or_query}, successFn, failFn);
	else
	   return this.call(RSClient.METHOD.DELETE, {id:id_or_query}, successFn, failFn);
}

RSClient.prototype["find"] = function(query, successFn, failFn){
  //missing query object should do a 'find all'
  return this.call(RSClient.METHOD.GET, {query:query}, successFn, failFn);
}

//aliases
RSClient.prototype.add = RSClient.prototype.create;
RSClient.prototype.get = RSClient.prototype.read;
RSClient.prototype.remove = RSClient.prototype["delete"];
RSClient.prototype.list = RSClient.prototype["find"];
RSClient.prototype.search = RSClient.prototype["find"];

if(typeof window.mbx == "undefined")
   window.mbx = {};
window.mbx.RSClient = RSClient;

if(typeof define === "function" && define.amd) {
	define([], function(){return RSClient});
}
if(typeof module == "object") {
  module.exports = RSClient;
}
})(jQuery);
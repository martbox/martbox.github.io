

/**
 * Loader.js JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * 
 * Tool for asynchronously loading a bunch of urls and running a callback function with the content when all are loaded.
 * 
 * Usage..
 * mbx.Loader.load(["test/test3.js", "test/test1.js", "test/test2.js"], function(results){}, doProcess);
 * 
 * Where results is array of objects looking like this..
 *   {
 *   url:"",   //url of resource loaded
 *   ext:"", //file extension
 *   status:5, //where:  NEW:1, REQUESTED:2, ERROR:3, LOADED:4, COMPLETE:5
 *   type:{},  //object describing how resource should be processed, depends on ext  
 *   content:"",  //processed content as loaded from the url (except js which are loaded by script tag)
 *   }
 * 
 * doProcess : this is optional boolean indicating whether content should also be processed...
 *   For css it is attached in a new style tag in the head of not done already.
 *   For HTML it is added as innerHTML to a new div element
 *   For JSON it is parsed to a js object.
 * 
 */

(function(){

var Loader = function(urls, doProcess){
  var scripts=[];
  var callback = {cb:null};
  
 
 /**
  * tries to process resources that have status STATUS.LOADED
  */
 var processResources = function(){
  var proto = Loader.prototype;
  var allComplete = true;
  for(var i=0; i<scripts.length; i++){
	  if(scripts[i].status==proto.STATUS.NEW) {
	  	allComplete = false;
	    break;  //unloaded resource
	  }
	  else if(scripts[i].status==proto.STATUS.ERROR){
	    //load failed on this one, but try to process others anyway for potential caching benefit 
	    allComplete = false;
	    continue; 
	  }
	  else if(scripts[i].status==proto.STATUS.COMPLETE){
	    //processed already, skip to next resource
	    continue; 
	  }
	  else if(scripts[i].status==proto.STATUS.REQUESTED){
	    allComplete = false; //response not received yet
	    break;  //unloaded resource
	  }
	  else if(scripts[i].status==proto.STATUS.LOADED) { //resource ready to process
	    try {
	      if(doProcess) {
	        proto.log("Processing content from: "+scripts[i].url+"..");
	        scripts[i].type.process(scripts[i]); //synchronous processing (e.g. eval/append)
	        scripts[i].status=proto.STATUS.COMPLETE;
          }
          else {
            scripts[i].status=proto.STATUS.COMPLETE;
          }
	    }
	    catch(e) {
	      proto.log("Processing content from "+scripts[i].url+" failed: "+e.description||e);
	      scripts[i].status==proto.STATUS.ERROR;
	      allComplete = false;
	    }
	  }
  }
  if(allComplete) {
  	Loader.prototype.PROCESS_FUNCS.removeFn(processResources); //stop listening for resource loaded events
    //all scripts loaded
    proto.log("scripts loaded.");
    if(callback.cb && typeof callback.cb === 'function') {
      proto.log("running callback..");
      callback.cb(scripts);
    }
  }
}; //processResource
  

  
this.load=function(cb) {
  var proto = Loader.prototype;
if(!urls) {
	throw "Loader created with no url(s)";
}
if(typeof urls==='string') {
	var resource = proto.RESOURCES[urls] || (proto.RESOURCES[urls] = new proto.Resource(urls));
	scripts.push( resource );	
}
else if(urls instanceof Array) {
	for(var i=0; i<urls.length; i++){
	    scripts.push( proto.RESOURCES[urls[i]] || (proto.RESOURCES[urls[i]] = new proto.Resource(urls[i])) );
	}
}

proto.PROCESS_FUNCS.addFn(processResources); //start listening for resource loaded events
  
  callback.cb = cb;
  var log = proto.log;
  log("load() called with "+scripts.length+" urls");
  var allComplete = true;
for(var i=0; i<scripts.length; i++){	
  if(scripts[i].status!=proto.STATUS.COMPLETE) {
  	allComplete = false;
  }
  if(scripts[i].status==proto.STATUS.NEW) { //request new resource
  
  	if(scripts[i].type==Loader.prototype.TYPE.JS) {
  		var scriptTag = document.createElement('script');
  		scriptTag.src=scripts[i].url;
  		scriptTag.onload=function(evt){
  			scripts.forEach(function(script){
  				if(evt.target.src && evt.target.src.indexOf(script.url)!=-1) {
  					script.content = "LOADED VIA SCRIPT TAG";
  					script.status=proto.STATUS.COMPLETE;
  					Loader.prototype.PROCESS_FUNCS.processResources();
  				}
  			});
  		};
  		scriptTag.onerror=function(evt){
	        scripts.forEach(function(script){
	          if(evt.target.src && evt.target.src.indexOf(script.url)!=-1) {
	            script.content = "ERROR OCCURED";
	            script.status=proto.STATUS.ERROR;
	            Loader.prototype.PROCESS_FUNCS.processResources();
	          }
	        });
	      };
  		log("script tag requesting "+scripts[i].url);
  		document.getElementsByTagName("head")[0].appendChild(scriptTag);
  		scripts[i].status=proto.STATUS.REQUESTED;
  	}
  	else {
		  scripts[i].xhr = new XMLHttpRequest();		  
		  scripts[i].xhr.index = i;
		  scripts[i].xhr.open('get', scripts[i].url);
		  scripts[i].xhr.onreadystatechange = function(){
			  if(this.readyState==4 && this.status==200) {
			    scripts[this.index].content=this.responseText || "";
			    log("Received "+scripts[this.index].content.length+" chars from "+scripts[this.index].url);
			    scripts[this.index].status=proto.STATUS.LOADED;
			    Loader.prototype.PROCESS_FUNCS.processResources();
			  }
			  else if(this.readyState==4 && this.status!=200) {
			    log("error: "+this.status+" requesting url: "+this.url);
			    scripts[this.index].status=proto.STATUS.ERROR;
			    Loader.prototype.PROCESS_FUNCS.processResources();
			  }
		  };
		  log("XMLHttpRequest requesting "+scripts[i].url);
		  scripts[i].xhr.send();
		  scripts[i].status=proto.STATUS.REQUESTED;
    }
  }
}
if(allComplete) { //if all resources already previously loaded/evaluated
	Loader.prototype.PROCESS_FUNCS.processResources(); //we need to process
}
}; //load
  
};//Loader constructor

//static shorthand
Loader.load = function(urls, callback, doProcess){
  if(doProcess===undefined)
  	(new Loader(urls, true)).load(callback); //process fetched data by default
  else
    (new Loader(urls, doProcess)).load(callback);
};

Loader.description = "Loader.js Loader class for async loading and processing of text based resources.\n usage: Loader.load(urls, doProcess, callback);";


// \/ \/ \/ \/ \/ \/ \/ STATICS \/ \/ \/ \/ \/ \/ 

Loader.prototype.RESOURCES = {
	//used to hold [url]:Resource mappings, to cache content already requested or loaded .
};

//holds references to processResource functions for each active loader instance
Loader.prototype.PROCESS_FUNCS = [];
Loader.prototype.PROCESS_FUNCS.addFn = function(processResourceFn) {
	Loader.prototype.PROCESS_FUNCS.push(processResourceFn);
};
Loader.prototype.PROCESS_FUNCS.removeFn = function(processResourceFn) {
	if(Loader.prototype.PROCESS_FUNCS.length>0) {
		for(var i=Loader.prototype.PROCESS_FUNCS.length-1; i>-1; i--) {
			if(Loader.prototype.PROCESS_FUNCS[i]===processResourceFn) {
				Loader.prototype.PROCESS_FUNCS.splice(i, 1); //remove 1 item at index i
				break;
			}
		}
	}
};
//causes all registered/interested functions to be called in the order added
Loader.prototype.PROCESS_FUNCS.processResources = function() {
	for(var i=0; i<Loader.prototype.PROCESS_FUNCS.length; i++) {
		Loader.prototype.PROCESS_FUNCS[i]();
	}
}


Loader.prototype.STATUS = {
	NEW:1, //newly defined resource, not requested yet
	REQUESTED:2, //request sent
	ERROR:3, //request failed
	LOADED:4, //response arrived ok
	COMPLETE:5 //processed if required
};

Loader.prototype.TYPE={
  JS:{ext:".js", 
    process:function(item){
      Loader.prototype.log("evaluating js from "+item.url);
      try {
        window.eval(item.content);
      }catch(e){
      	console.error(e);     
        throw e;        
      }
    }
  },
  CSS:{ext:".css", 
    process:function(item){
      if(document.getElementById(item.url)==null) {
        var style = document.createElement('style');
        style.id = item.url;
        style.innerHTML = item.content;
        document.getElementsByTagName('head')[0].appendChild(style);
      }
    }
  },
  JSON:{ext:".json", 
    process:function(item){
      item.content=JSON.parse(item.content);
    }
  },
  HTML:{ext:".html", 
    process:function(item){
      Loader.prototype.log("evaluating html from "+item.url);
      //add dom nodes to a containing div
      var div = document.createElement('div');
      div.innerHTML=item.content;
      item.content = div;
    }
  },
  TXT:{ext:".txt", 
    process:function(item){
    }
  }
};


Loader.prototype.Resource = function(url) {
	this.url = url;
	this.ext = url.substring(url.lastIndexOf('.'), url.indexOf('?')>-1 ? url.indexOf('?') : url.length);
	this.type = Loader.prototype.TYPE[this.ext.substring(1).toUpperCase()];
	
	this.status = Loader.prototype.STATUS.NEW;
	this.content = null;
};


Loader.prototype.log = function(msg) {

  console.log("Loader : "+msg);
  //alert(msg);
  
};


if(typeof window.mbx == "undefined")
  window.mbx={};
window.mbx.Loader = Loader; //expose on window

if(typeof define === "function" && define.amd) {
	define([], function(){return Loader});
}
if(typeof module == "object") {
    module.exports = Loader;
}



})();

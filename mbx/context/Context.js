/**
 * context.js JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * 
 * Requires..
 * mbx.HashRouter
 * mbx.Message
 * mbx.Loader
 * mbx.LogHandler
 * 
 * Tool encapsulating a number of mbx tools and placeholders in a mbx.CTX object..
 * 
 * {
 *   LABEL : property for grouping multilingual labels
 *   TYPE : property for grouping common object types/classes
 *   LOG : LogHandler instance for adding named loggers
 *   SETTING : property for grouping common constants/settings, e.g. LANGUAGE:"en"
 *   Message : class
 *   UTIL : property for grouping common utility functions
 *   HashRouter : class used to create hash change types you can subscribe to/from
 * }
 * 
 * Usage..
 */
(function(){

//check required globals available
if(typeof window.jQuery==="undefined") {
	throw "ERROR: jQuery not found";
}

var supportedLanguages = ["en"]; //see labels-##.json files

var Context = function(){
	var self = this;
	self.LABEL = {}; //namespace for multilingual labels, supplied via labels-en.json
	self.TYPE = {
		Message : null, // provided by Message/Message.js
		LogHandler : null, //provided by log/LogHandler.js
		Loader : null, //provided by loader/Loader.js
		HashRouter : null //provided by hash-router/HashRouter.js
	}; //root namespace for classes / object constructors
	self.UTIL = {
		load : null //provided by loader/Loader.js
	}; //root namespace for globally available static functions
	self.LOG = {}; //root namespace for Logger instances (provided by log/LogHandler.js)
	self.MESSAGE = {}; //root namespace for Message types you can send or subscribe to
	self.CONST = {
		//language used in the browser, falls back to "en"
    LANGUAGE : "en",
    ROOT_PATH : null, //set after init
		CURRENT_PATH : null //set after init
	}; //root namespace for constants
	self.SETTING = {}; //namespace for global modifiable settings
  self.ROUTE = {}; //namespace for valid hash change patterns you can subscribe to
	
	return self;
};

//initialises this context from the given documentObject, then calls the callback
Context.prototype.init = function(domOrJSUrlsArray, callback){
	  var self = this;
	  	  
	  //change language if we have a labels-##.json file for it
		var browserLanguage = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || "en";
		if(supportedLanguages.indexOf(browserLanguage)!=-1) {
		  self.CONST.LANGUAGE = browserLanguage;
		}
	  
    var jsDeps = [];
    if(!domOrJSUrlsArray) {
      throw "Context must be initialised with Array of MBX JS urls for Message.js, LogHandler.js, Loader.js, HashRouter.js, or Document object with context.js script tag from which to derive their locations."
    }
    if(domOrJSUrlsArray instanceof Array) {
      jsDeps = domOrJSUrlsArray;
    }
    else if(typeof domOrJSUrlsArray=="object"){
      //find path of mbx
      var mbxRoot = null;
      var scripts = domOrJSUrlsArray.getElementsByTagName("script");
      for(var i=0; i<scripts.length; i++) {
        var element = scripts[i];
        var index = element.src ? element.src.indexOf("context/Context.js") : -1;
        if(index>-1) {
          mbxRoot = element.src.substring(0, index);
        }
      }
      if(mbxRoot==null) {
        throw "path/to/mbx not found";
      }
      console.log("mbxRoot = "+mbxRoot);
      
      //build array of deps missing we need to load
      if(!mbx.Message) {
        jsDeps.push(mbxRoot + "message/Message.js");
      }
      if(!mbx.LogHandler) {
        jsDeps.push(mbxRoot + "log/LogHandler.js");
      }
      if(!mbx.HashRouter) {
        jsDeps.push(mbxRoot + "hash-router/HashRouter.js");
      }
      if(!mbx.Loader) {
        jsDeps.push(mbxRoot + "loader/Loader.js");
      }
      if(!mbx.URL) {
        jsDeps.push(mbxRoot + "url-utils/url-utils.js");
      }
      
      if(jsDeps.length==0) { //all js dependencies already available in the page
        if(typeof callback == "function") {
          callback();
        }
        return;
      }
      
      var onDepsLoaded = function(resources){
      	  //add convenience aliases into context TYPE namespace..
          self.TYPE.Message = mbx.Message;
          self.TYPE.LogHandler = mbx.LogHandler;
          self.TYPE.Loader = mbx.Loader;
          self.TYPE.HashRouter = mbx.HashRouter;
          self.LOG = new mbx.LogHandler();
          self.UTIL.load = mbx.Loader.load;
          self.UTIL.URL = mbx.URL;
          
          self.CONST.HOST = self.UTIL.URL.getHost(window.location.href);
          self.CONST.CURRENT_PATH = self.UTIL.URL.getPath(window.location.href);
          
          if(typeof callback == "function") {
            callback();
          }
      };
      
      //load the deps using requirejs if available or Loader if we already have it
      if(typeof require === "function" && require.amd) {
        require(jsDeps, onDepsLoaded);
      }
      else if(mbx.Loader) {
         mbx.Loader.load(jsDeps, onDepsLoaded);
      }
      else {
         throw "No script loader found, missing js dependencies couldn't be loaded.";
      }   
    }
    else {
      throw "Invalid argument, domOrJSUrlsArray must be Array of js urls or the Document object";
    }
  };


if(typeof window.mbx == "undefined")
  window.mbx={};
window.mbx.Context = Context;

if(typeof define === "function" && define.amd) {
  define([], function(){return Context});
}


})();


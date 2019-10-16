/*!
 * LogHandler JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)

Usage...

var log = new mbx.LoggingHandler();
log.add("NAME"); //adds a logger with given loggerName (enabled=false, logLevel=error initially)

//whether logger is enabled or not..
log.NAME.off();
log.NAME.on();
log.NAME.isOn();

//log an error,warn,log or debug like this..
log.NAME.warn("warning text");

//or only evaluate your string if the log level is enabled like this.. 
log.NAME.warn(log.NAME.W && "warning text");

//set the current log level
log.NAME.warn(true)
log.NAME.W //boolean indicating whether logging this level or not where..
E : error (level=100)
W : warn (level=200)
L : log (level=300)
I : info (level=400)
D : debug (level=500)

//to enable/disable ALL loggers...
log.on();  //all on
log.off();  // all off


*/

(function(){


	var LEVEL = {
		ERROR : 100,
		WARN : 200,
		LOG : 300,
		INFO : 300,
		DEBUG : 400,		
	};	
	
	function nameForLevel(levelNum) {
		var levelName = "";
		for(var p in LEVEL) {
			if(levelNum==LEVEL[p]) {
			  levelName = p;
			  break;
			}
		}
		return levelName;
	}
	
	var _errorHandler = function(logger, msg, obj) {
		if(console && console.error) {
			console.error(logger.loggerName + " : " + msg);
			if(obj) {
				console.error(obj.stack || obj);
			}
		}
	};
	var _warnHandler = function(logger, msg, obj) {
		if(console && console.warn) {
			console.warn(logger.loggerName + " : " + msg);
      if(obj) {
        console.warn(obj.stack || obj);
      }
		}	
	};
	var _logHandler = function(logger, msg, obj) {
		if(console && console.log) {
			console.log(logger.loggerName + " : " + msg);
      if(obj) {
        console.log(obj.stack || obj);
      }
		}	
	};
	var _debugHandler = function(logger, msg, obj) {
		if(console && console.debug) {
			console.debug(logger.loggerName + " : " + msg);
      if(obj) {
        console.debug(obj.stack || obj);
      }
		}	
	};


	
	function LogHandler(){
		this.loggers = [];		
	}
	LogHandler.prototype = {
		on: function(){
			for(var i=0; i<this.loggers.length; i++) {
				this.loggers[i].on();
			}
			return this;
		},
		off : function(){
			for(var i=0; i<this.loggers.length; i++) {
				this.loggers[i].off();
			}
			return this;
		},
		add : function(loggerName){
			var newLogger = new Logger(loggerName);
			if(!this[newLogger.loggerName]) { //add if we don't have one with this name yet
				this.loggers.push(newLogger);
				this[newLogger.loggerName] = newLogger;
			}
			return this[newLogger.loggerName];
		},
		list : function(){
			console.log("LogHandler has loggers..");
			for(var i=0; i<this.loggers.length; i++) {
				console.log(this.loggers[i].toString());
			}
			return this;
		}
	};
	LogHandler.LEVEL = LEVEL;
	
	var lhp = LogHandler.prototype;
	
	lhp.log = function(set, level){
	  if(level===undefined);
	    var level = LEVEL.LOG;
		for(var i=0; i<this.loggers.length; i++) {
			this.loggers[i].log(!!set, level);
		}
		return this;
	};
	lhp.error = function(set){
		return this.log(set, LEVEL.ERROR);
	};
	lhp.warn = function(set){
		return this.log(set, LEVEL.WARN);
	};
	lhp.debug = function(set){
		return this.log(set, LEVEL.DEBUG);
	};
	lhp.info = lhp.log;
	
	


	function Logger(loggerName){
			this.loggerName = loggerName.replace(/[ &?\/:]+/g, "_"); //sanitise for use as an object key
			this.enabled = false;
			this.logLevel = LEVEL.ERROR;
	};
	Logger.LEVEL = LEVEL;
	var lp = {};
	lp.on = function(){this.enabled=true; return this;};
  lp.off = function(){this.enabled=false; return this;};
	lp.isOn = function(){return this.enabled;};
	
	lp.toString = function(){
		return this.loggerName + " : " + (this.enabled?"on : ":"off : ") + nameForLevel(this.logLevel);
	};
	
	lp.log = function(msg, logLevel, obj){
			if(logLevel===undefined)
				var logLevel = LEVEL.LOG;
				
			if(msg===undefined){ //get if log level active
			  return logLevel<=this.logLevel;
			}
			else if(typeof msg=="boolean") { //set log level active
			  this.logLevel = msg ? logLevel : (logLevel-100);			
			  this.E = LEVEL.ERROR<=logLevel ? true : false;
			  this.W = LEVEL.WARN<=logLevel ? true : false;
			  this.L = LEVEL.LOG<=logLevel ? true : false;
			  this.I = this.L;
			  this.D = LEVEL.DEBUG<=logLevel ? true : false;
		  }
			else if(this.enabled && logLevel<=this.logLevel) { //log message
				if(logLevel==LEVEL.ERROR)
					_errorHandler(this, msg, obj);
				if(logLevel==LEVEL.WARN)
					_warnHandler(this, msg, obj);
				if(logLevel==LEVEL.LOG)
					_logHandler(this, msg, obj);
				if(logLevel==LEVEL.DEBUG)
					_debugHandler(this, msg, obj);
			}
			else {
				return null;
			}
			return this;
		};
	
	lp.error = function(msg, obj){
		return this.log(msg, LEVEL.ERROR, obj);
	};
	lp.warn = function(msg, obj){
		return this.log(msg, LEVEL.WARN, obj);
	};
	lp.debug = function(msg, obj){
		return this.log(msg, LEVEL.DEBUG, obj);
	};
	lp.info = lp.log;
		
	Logger.prototype = lp;
	


if(typeof window.mbx == "undefined")
   window.mbx = {};
window.mbx.LogHandler = LogHandler;

if(typeof define === "function" && define.amd) {
	define([], function(){return LogHandler});
}
if(typeof module == "object") {
	module.exports = LogHandler;
}

})(); //shield




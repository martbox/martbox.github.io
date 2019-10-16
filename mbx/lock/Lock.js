(function(){
	
  //simple lock controller
  function Lock(name, onLock, onRelease){   
    this.name = name || "anonymous";
    this.owner = null;
    this.onLockSubscribers = typeof onLockSubscribers=="function"?[onLock]:[];
    this.onReleaseSubscribers = typeof onReleaseSubscribers=="function"?[onRelease]:[];
    
    this.logger = {E:false,D:false,W:false,L:false,I:false,
      error:function(msg, obj){if(msg)console.error(msg);},
      warn:function(msg, obj){if(msg)console.warn(msg);},
      debug:function(msg, obj){if(msg)console.log(msg);}
    };
    if(CTX && CTX.TYPE.LogHandler && CTX.LOG instanceof CTX.TYPE.LogHandler) {
      this.logger = CTX.LOG.add('Lock_'+this.name); //logger added for each new Message instance created
      this.logger.on().debug(true);
    }
  }
  Lock.ANON = "anonymous";
  Lock.prototype.onLock = function(callback){
  	if(typeof callback=="function") {
  		this.onLockSubscribers.push(callback);
  	}
  };
  Lock.prototype.onRelease = function(callback){
    if(typeof callback=="function") {
      this.onReleaseSubscribers.push(callback);
    }
  };
  Lock.prototype.unsubscribe = function(callback){
  	var removed = false;
    if(typeof callback=="function") {
      var i = this.onLockSubscribers.indexOf(callback);
      if(1>-1) {
      	this.onLockSubscribers.splice(i, 1);
      	removed = true;
      }
      i = this.onReleaseSubscribers.indexOf(callback);      
      if(1>-1) {
        this.onReleaseSubscribers.splice(i, 1);
        removed = true;
      }
    }
    return removed;
  };
  Lock.prototype.obtain = function(_owner){
    var owner = _owner || Lock.ANON; 
    if(this.owner==null || this.owner==owner) {
       this.owner = owner;       
       this.onLockSubscribers.forEach(function(callback){
	       	 try{callback();}
	       	 catch(e){console.error(e);} //don't block all in the list
	       });    
       return true;
    }
    else {
      this.logger.warn(this.logger.W && "Lock obtain for '"+this.name+"' REFUSED, current owner "+(this.owner.name||".."), this.owner);
      return false;
    }
  }
  Lock.prototype.release = function(_owner){
    var owner = _owner || Lock.ANON; 
    if(this.owner==owner) {
       this.owner=null; 
       this.onReleaseSubscribers.forEach(function(callback){
           try{callback();}
           catch(e){console.error(e);} //don't block all in the list
         }); 
       return true;
    }
    else {
      this.logger.warn(this.logger.W && "Lock release for '"+this.name+"' REFUSED, current owner "+(this.owner.name||".."), this.owner);
      return false;
    }
  }
  Lock.prototype.forceRelease = function(){
    if(this.owner!=null) {      
      this.logger.warn(this.logger.W && "Lock for '"+this.name+"' force released from current owner "+(this.owner.name||".."), this.owner);      
      this.owner=null;
      this.onReleaseSubscribers.forEach(function(callback){
           try{callback();}
           catch(e){console.error(e);} //don't block all in the list
         });
    }
  }
  Lock.prototype.isLocked=function(){
  	return this.owner!=null;
  }
  
  if(typeof window.mbx=="undefined")
    window.mbx = {};
  window.mbx.Lock = Lock;
  
  if(typeof define === "function" && define.amd) {
	  define([], function(){return Lock});
	}    
  if(typeof module == "object") {
    module.exports = Lock;
	}
  
})();
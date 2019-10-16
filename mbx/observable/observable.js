/*
 * observable.js JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * 
 * 
 * Provides a function 'mbx.observable' which you can use to create an observable wrapper function and
 * apply listener functions that will be called and start/complete of the wrapped/underlying function.
 * All listener functions are called synchronously.
 * 
 * Usage..
 * //wrap a function inside a new observable one..
 * var obsFn = observable(function(a, b){return a + b});
 * 
 * //add a function to call before the wrapped one..  
 * var startInterceptor = function(a, b){console.log('fn called with a='+a+' and b='+b)};
 * obsFn.onStart(startListener);
 * 
 * Any onStart listener returning false will return immediately preventing further execution.
 * 
 * //add a function to call when the wrapped one completes..
 * var completeInterceptor = function(retVal, args){return retVal + 5};
 * obsFn.onComplete(completeInterceptor);
 * 
 * The return value is passed to all onComplete listeners.
 * A return value from any onComplete listener will override the main return value before being passed
 * to the next onComplete listener.
 * 
 * //Other helpful stuff..
 * 
 * obsFn.catchExceptions(true);  //catches and exception, calls default exception handler that just logs it
 * 
 * obsFn.setExceptionHandler(function(exception, arguments){}); //override default exception handler
 * 
 * obsFn.setImpl(function(a, b){return a * b});  //change wrapped/underlying function
 */

(function(){

var observable = function(fn, contextObj){  

  if (typeof fn != "function") {
    throw "1st argument should be a function";
  }
  
  var beforeStart=[];
  var afterComplete=[];
  var exceptionHandler=function(e, args){
    console.log("Exception caught running function with arguments: "+args);
    console.error(e.description||e);
  };
  var implFn = fn;
  var catchExceptions = false;
  
  
  var newFn = function() {
    var context = contextObj || this; //given or current context obj
    var args = [];
    for(var i=0; i<arguments.length; i++) {
      args.push(arguments[i]);
    }
      
    //run all beforeStart functions    
    var exec = true;
    beforeStart.forEach(function(listenerFn) {
      if(exec) {
        if(listenerFn.apply(context, args)===false) {
          exec = false;
        }
      }
    });
    
    //block further execution if any beforeStart functionss returned false
    if (!exec)
      return;
            
    //run implementing function
    var returnVal;
    if(catchExceptions) { //catch and log exception if required
      try {
        returnVal = implFn.apply(context, args);
      }
      catch(e) {
        exceptionHandler(e, args);
      }
    }
    else {
      returnVal = implFn.apply(context, args);
    }
      
    
    //run [returnVal, args] through all afterComplete functions
    //updating the return value each time if one is returned
    afterComplete.forEach(function(listenerFn) {
      var newRetVal = listenerFn.apply(context, [returnVal, args]);
      if(typeof newRetVal != "undefined"){
        returnVal = newRetVal;
      }
    });
        
    return returnVal;
  };
  
  
  newFn.onStart=function(listenerFn){
    if(typeof listenerFn != "function")
      throw "listenerFn passed to onStart isn't a function";
    if(beforeStart.indexOf(listenerFn)==-1)
      beforeStart.push(listenerFn);
  };
  
  newFn.onComplete=function(listenerFn){
    if(typeof listenerFn != "function")
      throw "listenerFn passed to onComplete isn't a function";
    if(afterComplete.indexOf(listenerFn)==-1)
      afterComplete.push(listenerFn);
  };

  
  newFn.off=function(listenerFn){
    
      if(typeof listenerFn != "function") {
          throw "listenerFn passed to 'off' isn't a function";
      }
    
      if(listenerFn) {  //remove specified subscriber
        if(typeof listenerFn != "function") {
          throw "listenerFn passed to 'off' isn't a function";
        }
        var i = afterComplete.indexOf(listenerFn);
        if(i>-1)
           afterComplete.splice(i, 1);
        
        var i = afterComplete.indexOf(listenerFn);
        if(i>-1)
           afterComplete.splice(i, 1);
        
        i = beforeStart.indexOf(listenerFn);
        if(beforeStart[i]==listenerFn)
           beforeStart.splice(i, 1);
      }

  };
  
  newFn.catchExceptions = function(bool){
    if(typeof bool == "boolean") {
      catchExceptions = bool;
    }
  };
  
  //Sets the underlying/wrapped function called
  newFn.setImpl = function(newImplFn){
    if(typeof newImplFn == "function") {
      implFn = newImplFn;
    }
  };
  
  //override default exception handler
  newFn.setExceptionHandler = function(exHandler){
    if(typeof exHandler != "function") {
      throw "setExceptionHandler expects a function";
    }    
    exceptionHandler = exHandler;
    catchExceptions = true;
  }
  
  
  return newFn;
};

if(typeof window.mbx == "undefined")
  window.mbx={};
window.mbx.observable = observable;

if(define && typeof define === "function" && define.amd) {
  define([], function(){return observable});
}

})();
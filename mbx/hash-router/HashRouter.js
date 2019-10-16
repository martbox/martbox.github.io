/*!
 * HashRouter JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

/*
Provides a HashRouter class you can use to register handlers to respond 
when the location.hash changes from or to a given regex hashRegExp match.

Usage...

var hR = new HashRouter(hashRegExp, object2HashStringFn, hashString2ObjectFn);

hR.subscribe(changeToFn, changeFromFn); //listen for when location.hash changes TO and FROM this hash.

hR.unsubscribe(changeToFn, changeFromFn); //stop listening

hR.change(object); //object is passed to constructHashFn and resultng hash string set on location.hash


Static methods..

HashRouter.change(hashString); //change current hash string to the given one, triggering hashchange event

HashRouter.hashChanged(): //The handler function bound to the window hashchange event.
                          //This is available here to call manually so you can trigger it on initial page load. 

*/
(function(){
  
var hashRouters = [];
var currentHash = null;

  
var HashRouter = function(hashRegExp, hashConstructor, hashDeconstructor) {
  var self = this;
  self.changedToSubscribers = [];
  self.changedFromSubscribers = [];
  if(typeof hashRegExp == "string") {
    self.hashRegExp = new RegExp(hashRegExp);
  }
  else if(hashRegExp instanceof RegExp) {
    self.hashRegExp = hashRegExp;
  }
  else {
    throw "HashRouter hashRegExp must be RegExp object or string to construct one with.";
  }
  self.hashConstructor = hashConstructor || function(object){return typeof object=="string"?object:""};
  self.hashDeconstructor = hashDeconstructor || function(hashString){return typeof hashString=="string"?hashString:""};
  hashRouters.push(self);  
};

HashRouter.prototype.subscribe = function(changedToFn, changedFromFn){
  if(typeof changedToFn!="function") {
    throw "HashRouter.subscribe function expects 'changedToFn' argument to be a function";
  }
  if(typeof changedFromFn!="function") {
    throw "HashRouter.subscribe function expects 'changedFromFn' argument to be a function";
  }
  
  if(this.changedToSubscribers.indexOf(changedToFn)==-1) {
    this.changedToSubscribers.push(changedToFn);
  }
  if(this.changedFromSubscribers.indexOf(changedFromFn)==-1) {
    this.changedFromSubscribers.push(changedFromFn);
  }
  
};

HashRouter.prototype.unsubscribe = function(changedToFn, changedFromFn){
  var i = this.changedToSubscribers.indexOf(changedToFn)
  if(i!=-1) {
    this.changedToSubscribers.splice(i, 1);
  }
  i = this.changedFromSubscribers.indexOf(changedFromFn);
  if(i!=-1) {
    this.changedToSubscribers.splice(i, 1);
  }
};

HashRouter.prototype.change = function(obj){
  var hashString = this.hashConstructor(obj);
  if(!this.hashRegExp.test(hashString)) {
    throw "The hash string '"+hashString+"' doesn't match expected RegExp pattern : "+this.hashRegExp.source;
  }
  if(location.hash!=("#"+hashString)) { //only change location.hash if it's different
    location.hash = hashString;
  } 
};


HashRouter.hashRouters = hashRouters;

//trigger hash change using given hashString
HashRouter.change = function(hashString) {
  if(location.hash!=("#"+hashString)) {
    location.hash = hashString;
  } 
}

//called when hashchange occured to inform subscribers 
HashRouter.hashChanged = function(){
  var newHash = location.hash.substring(1); //chop off leading #
  var hashRouterFound = false;
  var subscriberFound = false;
  
  //inform relevant changeFrom subscribers
  if(currentHash && currentHash!==newHash) {
    hashRouters.forEach(function(hashRouter){
      console.log(hashRouter);
      if(hashRouter.hashRegExp.test(currentHash)) { //matching router found
        hashRouterFound = true;
	      hashRouter.changedFromSubscribers.forEach(function(subscriberFn){
	        subscriberFound = true;
	        try {
	          subscriberFn();
	        }
	        catch(e){ //don't prevent other subscribers from being called
	          console.error(e);
	        }
	      });
      }
    });
    
    if(!hashRouterFound) {
      console.warn("HashRouter not found for hash: "+currentHash);
    }
    if(!subscriberFound) {
      console.warn("changeFrom subscriber not found on HashRouter for hash: "+currentHash);
    }
  }  
  
  //inform relevant changedTo subscribers
  if(currentHash==null || newHash!=currentHash) {
    hashRouterFound = false;
    subscriberFound = false;
    
    hashRouters.forEach(function(hashRouter){
      if(hashRouter.hashRegExp.test(newHash)) { //matching router found
        hashRouterFound = true;
        var obj = hashRouter.hashDeconstructor(newHash);
        hashRouter.changedToSubscribers.forEach(function(subscriberFn){                    
          subscriberFound = true;
          try {
            subscriberFn(obj);
          }
          catch(e){ //don't prevent other subscribers from being called
            console.error(e);
          }
        });
      }
    });
    
    if(!hashRouterFound) {
      console.warn("HashRouter not found for hash: "+newHash);
    }
    if(!subscriberFound) {
      console.warn("changeTo subscriber not found on HashRouter for hash: "+newHash);
    }
     
  }  
  currentHash = newHash;
};

//start listening for hashchange events
window.addEventListener('hashchange', HashRouter.hashChanged); 


if(typeof window.mbx == "undefined")
  window.mbx={};
window.mbx.HashRouter = HashRouter;

if(typeof define === "function" && define.amd) {
  define([], function(){return HashRouter});
}
if(typeof module == "object") {
    module.exports = HashRouter;
}
})();
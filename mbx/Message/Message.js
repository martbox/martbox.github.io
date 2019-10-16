
/*!
 * Message.js JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * 
 * For creating simple observable Message objects with optional validation of messageBody  
 * 
 * Usage...
 * 
 * //create new message type
 * var messageType = mbx.Message("my message type", validator);
 * 
 * Where validator is an optional object with a validate(messageBody) function on it that
 * will return false if the message body is invalid.
 * 
 * //add a subscriber / listener of myMessage
 * var subscriber = function(messageBody){
 *   //do something in response to receiving messageBody
 * }
 * messageType.subscribe(subscriber);
 * 
 * //unsubscribe / stop listening to myMessage
 * messageType.unsubscribe(subscriber);
 * 
 * //remove all subscribers/listeners
 * messageType.unsubscribeAll();
 * 
 * //send message body to subscribers of your messageType (asynch)
 * messageType.send(messageBody);
 * 
 * //send message body to subscribers of your messageType synchronously in same thread.
 * messageType.sendSynch(messageBody);
 * 
 */

(function(){

var NAME_REGEX = new RegExp("^[a-zA-Z]{1}[a-zA-Z0-9_\-]*$");

//logger suitable string describing a function
function stringDescription(fn) {
	return fn.name?fn.name:"unknown" + fn.description?" ("+fn.description+")":"";
}

var Message = function(name, messageValidator){
	 if(typeof name!="string" || !NAME_REGEX.test(name) ) {
	 	 throw "Invalid name for Message, use string suitable for an object property name. e.g. new Message('REQUEST_SOMETHING', {validate:function(){return true/false}} )"
	 }
	 this.logger = {
      //error  debug   warn   log      info
      E:false,D:false,W:false,L:false,I:false,
		  error:function(msg, obj){if(msg)console.error(msg);},
		  debug:function(msg, obj){if(msg)console.log(msg);}
		};
		if(CTX && CTX.LOG) {
		  this.logger = CTX.LOG.add('Message_'+name); //logger added for each new Message instance created
		  this.logger.on().debug(true);
		}
		
   this.subscribers = []; //the functions to call with message body when sent
   this.name = name || ""; //what this message represents
   this.jsocsValidator = messageValidator || {validate:function(body){return true}};  //for validating message body when sent
   this.logger.debug(this.logger.D && "Created Message '"+name+"'");
}
//add a subscriber function for this message
Message.prototype.subscribe=function(subscriberFn){
	 if(typeof subscriberFn !== "function") {
	   throw "Message.subscribe() expects function but got "+typeof subscriberFn;
	 }
	 if(this.subscribers.indexOf(subscriberFn)==-1) {
	 	 this.logger.debug(this.logger.D && "added subscriber "+stringDescription(subscriberFn));
	   this.subscribers.push(subscriberFn);
	 }
	 else {
	 	 this.logger.warn(this.logger.W && "subscriber ("+stringDescription(subscriberFn)+") not added as already registered.");
	 }
};
//remove a subscriber function from this message
Message.prototype.unsubscribe=function(subscriberFn){
	if(typeof subscriberFn !== "function") {
     throw "Message.unsubscribe() expects function but got "+typeof subscriberFn;
  }
  var i = this.subscribers.indexOf(subscriberFn);
  if(1>-1) {
  	this.logger.debug(this.logger.D && "subscriber ("+stringDescription(subscriberFn)+") removed.");
    this.subscribers.splice(i, 1);
  }
  else {
  	this.logger.warn(this.logger.W && "subscriber ("+stringDescription(subscriberFn)+") not removed as not found.");
  }
};
//remove all subscribers
Message.prototype.unsubscribeAll=function(){
	this.subscribers.splice(0, this.subscribers.length);
	this.logger.debug(this.logger.D && "All subscribers removed.");
};
//send the given message body to all subscriber functions of this message
//validating the message body first if this message has a validator.
//completes before subscriber functions run in timeouts (asynchronous)
Message.prototype.send=function(messageBody){
	var self = this;
	if(self.jsocsValidator.validate(messageBody)) {
		self.subscribers.forEach(function(subscriberFn){
			self.logger.debug(self.logger.D && "Sending (asynch) to subscriber "+stringDescription(subscriberFn), messageBody);
		  setTimeout(function(){subscriberFn(messageBody)}, 1);
		});
		if(self.subscribers.length==0) {
			self.logger.warn(self.logger.W && "No subscribers found.");
		}
	}
	else {
		self.logger.error(self.logger.E && "messageBody invalid.. ", messageBody);
	}
};
//send the given message body to all subscriber functions of this message
//validating the message body first if this message has a validator.
//Doesn't complete until all subscriber functions have run (synchronous) 
Message.prototype.sendSynch=function(messageBody){
	var self = this;
  if(self.jsocsValidator.validate(messageBody)) {
    self.subscribers.forEach(function(subscriberFn){
      try {
      	self.logger.debug(self.logger.D && "Sending (synch) to subscriber "+stringDescription(subscriberFn), messageBody);
        subscriberFn(messageBody);
      }
      catch(e) { //don't block other subscribers on error
        self.logger.error(self.logger.E && "Error sending to subscriber "+stringDescription(subscriberFn), e);
        console.error(e);
      }
    });
    if(self.subscribers.length==0) {
      self.logger.warn(self.logger.W && "No subscribers found.");
    }
  }
  else {
  	self.logger.error(self.logger.E && "messageBody invalid.. ", messageBody);
  }
};

//aliases
Message.prototype.observe = Message.prototype.subscribe;
Message.prototype.listen = Message.prototype.subscribe;
Message.prototype.stopListening = Message.prototype.unsubscribe;
Message.prototype.stopObserving = Message.prototype.unsubscribe;
Message.prototype.fire = Message.prototype.send;
Message.prototype.notify = Message.prototype.send;

	
if(typeof window.mbx=="undefined")
	window.mbx = {};
window.mbx.Message = Message;

if(typeof define === "function" && define.amd) {
	define([], function(){return Message});
}
if(typeof module == "object") {
	  module.exports = Message;
}
})();
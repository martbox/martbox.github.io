/*!
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */
if(typeof window.ko=="object") {
  window.ko.observableProps = function(obj, addSettersGetters){
    var newObj = {};
    var fn = function(obj){
      if(typeof obj=="object") {
        for(var param in obj) {
          if(newObj.hasOwnProperty(param)) //update existing observables value
            newObj[param](obj[param]);
          else {//make new observable
            if(obj[param] instanceof Array)
              newObj[param] = ko.observableArray(obj[param]);
            else
              newObj[param] = ko.observable(obj[param]);
              
            if(typeof addSettersGetters == "boolean" && addSettersGetters) {
            	(function(observableFn){            		
            		observableFn.set = function(newValue){
                  return observableFn(newValue);
	              }
	              observableFn.get = function(){
	                return observableFn();
	              }            		
            	})(newObj[param]);
            }
            
            fn[param] = newObj[param]; //allow direct access to contained observables
          }
        }
      }
      else {
        var retObj = {};
        for(var p in newObj) { //unwrap observable props
          retObj[p] = newObj[p]();
        }
        return retObj;
      }
    }
    fn(obj);
    return fn;
  }
}
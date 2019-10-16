
describe("observable.js spec", function() {

  var observable = null;

  var MOCK = {
  	
  };  

  beforeEach(function(done) {
  	if(observable===null) {
	  	require(['observable'], function(_observable){
	  		observable = _observable;
	  		done();
	  	});
  	}
  	else {
  		done();
  	}
  });
  
  afterEach(function() {
  });

  it("1) runs onStart function that then blocks underlying fn execution", function() {
    var fn = function(a, b){return a + b};
    var obsFn = observable(fn);
    var called = false;

    //add a function to call before the wrapped one..  
    var startInterceptor = function(a, b){
      called = true;
      return false;
    };
    //register star listener
    obsFn.onStart(startInterceptor);
    //call observable function
    var retVal = obsFn(1, 2);
    
     expect(retVal).toBeUndefined(); //execution of fn blocked
     expect(called).toBe(true); //startInterceptor function ran
  });


  it("2) runs onStart functions before underlying fn runs", function() {
    var fn = function(a, b){return a + b},
      obsFn = observable(fn),
      calledA = 0, 
      calledB = 0;

    //register start listeners
    obsFn.onStart(function(a, b){ calledA = a; });
    obsFn.onStart(function(a, b){ calledB = b; });
    //call observable function
    var retVal = obsFn(1, 2);
    
     expect(retVal).toEqual(3); //execution of fn worked
     expect(calledA).toBe(1);
     expect(calledB).toBe(2);
  });


  it("3) runs onComplete functions, changing return value after fn completes", function() {
    var fn = function(a, b){return a + b};
    var obsFn = observable(fn);

    //register onComplete listeners that change return value in sequence
    obsFn.onComplete(function(val){return val-1});
    obsFn.onComplete(function(val){return val+1});
    obsFn.onComplete(function(val){return val+3});
    
    //call observable function
    var retVal = obsFn(1, 2);
    
    //execution of fn worked and then had 3 added to it by the completeInterceptor
     expect(retVal).toEqual(6);
  });

  
  it("4) runs different function after calling set by setImpl", function() {
    var fn1 = function(a, b){return a + b};
    var obsFn = observable(fn1);
    //replace wrapped function
    obsFn.setImpl(function(a, b){return a-b});
    
    //call observable function
    var retVal = obsFn(1, 2);

     expect(retVal).toEqual(-1);
  });
  
  
  it("5) calls exceptionHandler if one is set and underlying fn throws exception", function() {
    var fn = function(a, b){ throw "ERROR" };
    var obsFn = observable(fn);
    var result = "";
    //replace wrapped function
    obsFn.setExceptionHandler(function(exception, args){
      result = exception + " args were : "+args;
    });
    
    //call observable function
    obsFn(1, 2);

     expect(result).toEqual("ERROR args were : 1,2");
  });
  
});

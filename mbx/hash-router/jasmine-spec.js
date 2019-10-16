
describe("HashRouter.js spec", function() {

  var HashRouter = null;

  beforeEach(function(done) {
  	if(HashRouter===null) {
	  	require(['HashRouter'], function(_HashRouter){
	  		HashRouter = _HashRouter;
	  		done();
	  	});
  	}
  	else {
  		done();
  	}
  });
  
  afterEach(function() {
  });

  it("1) calls registered to/from hashchange listener functions ", function(done) {
     
     var mockHashObj = {value:"myhash"};
     
     var route = new HashRouter("myhash", 
       function(obj){return obj.value}, 
       function(hashString){return mockHashObj}
     );
          
     var listen = {
       forChangeTo : function(){ //changed TO "myhash"
         console.log("Ran forChangeTo function");
         HashRouter.change("some_other_url_hash");
       },
       forChangeFrom : function(){ //changed FROM "myhash"
         console.log("Ran forChangeFrom function");
         expect(listen.forChangeTo).toHaveBeenCalledWith(mockHashObj);
         
         done();
       }
     };
     
     spyOn(listen, "forChangeTo").and.callThrough();;
          
     route.subscribe(
       listen.forChangeTo, 
       listen.forChangeFrom
     );
     
     route.change({value:"myhash"});
     
  });

  
});

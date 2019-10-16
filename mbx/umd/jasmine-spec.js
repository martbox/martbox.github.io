
	describe("umd module example spec", function() {
		console.log((new Date())+ " : 'umd module example spec' executing");

	  beforeEach(function() {
    	top.globalModule = null;
  		top.define = null;
	  	top.require = function(){};
	  	top.module = null;
	  	//clear response cache
	  	if(!top._Loader) {
	  	  top._Loader = Loader;
	  	  top.Loader = null; 
	  	}		 
		top._Loader.prototype.RESOURCES={};    
	  });
	  
	  afterEach(function() {	  	 
	  });

	  it("registers global module when no module loader framework present", function(done) {
		
		expect(require).not.toBeNull();
				
		_Loader.load("main.js", function(resources){
			expect(top.testModule).not.toBeUndefined();
			expect(top.testModule.moduleWithDependency.load).not.toBeNull();
			done();
		});
				
	  });
	  
	  it("registers AMD module if define is found", function(done){
	  	delete top.require;
	  	delete top.define;
	  	/*
	    top.define = function(deps, factory){
	       factory(_Loader);
	    }; //mock define fn
	    top.require = function(dep, callback){
	      callback(function(){});
	    };
	    top.define.amd = true;
	    */
	    _Loader.load("../../lib/requirejs-2.2.0/require.js", function(resources){
	    	require(["main"], function(main){ //should load the js, run define and pass the return object in here..
	    	  expect(main.moduleWithDependency).not.toBeNull();
			  expect(main.moduleWithDependency.load).not.toBeNull();
		  	  done();
		    });
		  
		});
	    
	    
	  });


	  it("exports CommonJS module if require is found", function(done){
	    top.require = function(dep){
	      return _Loader;
	    }
	    top.module={exports:{}};
	    
	    _Loader.load("main.js", function(resources){
	    
      expect(top.module.exports).not.toBeUndefined();
			  expect(top.module.exports.moduleWithDependency).not.toBeUndefined();
			expect(top.module.exports.moduleWithDependency.load).not.toBeNull();
		  	done();
		  });
	  
	  });
	  
	});


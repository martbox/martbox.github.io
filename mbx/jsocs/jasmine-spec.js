
describe("jsocs spec", function() {

  var loaded = false;

  var MOCK = {

  };
  
  function logValidator(testName, validator){
  	console.log(testName+" failed. validator was...");
	console.log(validator);
  }
  
  beforeEach(function(done) {
  	if(loaded===false) {
	  	require(['jsocs'], function(){
	  		loaded = true;
	  		window.JSOCS = mbx.JSOCS;
	  		done();
	  	});
  	}
  	else {
  		done();
  	}
  });
  
  afterEach(function() {
  });

  it("1) validates a string parameter with regex", function() {
	var validator = JSOCS.compile({str:"", req:true, rgx:"abc"});	
	
	var isValid = validator.validate("abc"); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	var isValid = validator.validate(true); //should fail
	if(!isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
	
	isValid = validator.validate({a:123});	//check data type
	if(isValid) { logValidator("3)", validator); }
	expect(isValid).toBe(false);
	
	isValid = validator.validate("abd"); //check regex	
	if(isValid) { logValidator("4)", validator); }
	expect(isValid).toBe(false);	
  });

  it("2) validates a string parameter max length", function() {
	var validator = JSOCS.compile({str:"", req:true, max:3});	
	
	var isValid = validator.validate("abc"); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	isValid = validator.validate("abdf");	//should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
  });
  
  it("3) validates a string parameter min length", function() {
	var validator = JSOCS.compile({str:"", req:true, min:3});	
	
	var isValid = validator.validate("abc"); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	isValid = validator.validate("ab");	//should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
  });

  it("4) validates a string parameter against enumeration ('only' prefix)", function() {
	var validator = JSOCS.compile({
		only:["abc", "def"]
	});	
	
	var isValid = validator.validate("abc"); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	isValid = validator.validate("abcdef");	//should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
  });

  it("5) validates a number parameter max limit", function() {
	var validator = JSOCS.compile({num:123, req:true, max:100});	
	
	var isValid = validator.validate(100); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	isValid = validator.validate(101);	//should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
  });
  
  it("6) validates a number parameter min limit", function() {
	var validator = JSOCS.compile({num:123, req:true, min:100});	
	
	var isValid = validator.validate(100); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	isValid = validator.validate(99);	//should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
  });

  it("7) validates a number parameter precision", function() {
	var validator = JSOCS.compile({num:123, req:true, prn:2});	
	
	var isValid = validator.validate(2.11); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
			
	isValid = validator.validate(2.111);	//should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
	
	isValid = validator.validate(2.1);	//should fail
	if(isValid) { logValidator("3)", validator); }
	expect(isValid).toBe(false);
  });
  
  
  it("8) validates an object with different property types and array data types", function() {
	var validator = JSOCS.compile({
		obj:{
			a_num_req : null,
			b_str_req : null,
			c_bool : null,
			d_obj : {},
			e_str_arr : null
		}
	});	
	
	var obj = {a:123, b:"abc", c:true, d:{any:"thing"}, e:["abc","ghy"]};
	var isValid = validator.validate(obj); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	var broken_b = {a:123, b:123456, c:true, d:{any:"thing"}, e:["abc","ghy"]};
	isValid = validator.validate(broken_b);	//should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);	
	
	var broken_e = {a:123, b:"abc", c:true, d:{any:"thing"}, e:[345,123]};
	isValid = validator.validate(broken_e);	//should fail
	if(isValid) { logValidator("3)", validator); }
	expect(isValid).toBe(false);	
  });
  

  it("9) Validates inclusion rule (required, optional, illegal)", function() {
	var validator = JSOCS.compile({
		obj:{
			a_num_req : null, //required
			b_str_opt : null, //optional (default)
			c_bad : null //illegal
		}
	});	
	
	var obj = {a:123, b:"abc"};
	var isValid = validator.validate(obj); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
	
	var obj = {a:123};
	var isValid = validator.validate(obj); //should pass
	if(!isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(true);
	
	var obj = {a:123, b:"abc", c:"illegal"};
	var isValid = validator.validate(obj); //should fail
	if(isValid) { logValidator("3)", validator); }
	expect(isValid).toBe(false);
  });
  
  
  it("10) Validates against rules referred by id", function() {
	var validator = JSOCS.compile({
		obj:{
			jsocs_myNum:{
				req:null,
				num:null //required
				
			},
			a_idref_req : "myNum" //required
		},
		req:null
	});	
	
	console.log(validator);
	
	var obj = {a:123};
	var isValid = validator.validate(obj); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
		
	var obj = {a:"abc"};
	var isValid = validator.validate(obj); //should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
  });
  
  
  it("11) Validates against rules referred by id on another namespace", function() {
    var namespacedRules = {
		obj:{			
			jsocs_ns:"namespace2",
			jsocs_myNum:{
				req:null,
				num:null
			}
		}
	}
	var myJSocs = {		
		obj:{ //it's an object
			jsocs_ns:"namespace1",
			jsocs_ns_prfx : namespacedRules,
			a_idref : "prfx.myNum"
		},
		req:null //it's required
	};
	var validator = JSOCS.compile(myJSocs);	
	
	var obj = {a:123};
	var isValid = validator.validate(obj); //should pass
	if(!isValid) { logValidator("1)", validator); }
	expect(isValid).toBe(true);
		
	var obj = {a:"abc"};
	var isValid = validator.validate(obj); //should fail
	if(isValid) { logValidator("2)", validator); }
	expect(isValid).toBe(false);
  });

});

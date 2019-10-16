
describe("jsid spec", function() {

  var jsid = null;

  var MOCK = {
  	objectModel1 : {
  		//so a.b.id:"123" should get object with d = fred
  		a :	{
  			b: [
  			  {id:"123", d:"fred"},
  			  {id:"345", d:"dave"}
  			]
  		},
  		idref1: "IDPATH:a.b.id:123",
  		idref2: "IDREF:myIDType:345"
  	},
  	objectModel2 : {
  		//so a.b.id:"123" should get object with d = fred
  		a :	{
  			b: [
  			  {id:"123", d:"fred"},
  			  {id:"345", d:"dave"}
  			]
  		},
  		idref1: null,
  		idref2: null
  	},
  	idRefResolver: {
  	  myIDType: "[a][b][id]"
  	}
  };
  
  MOCK.objectModel2.idref1 = MOCK.objectModel2.a.b[0];
  MOCK.objectModel2.idref2 = MOCK.objectModel2.a.b[1];
  

  beforeEach(function(done) {
  	if(jsid===null) {
	  	require(['jsid'], function(_jsid){
	  		jsid = _jsid;
	  		done();
	  	});
  	}
  	else {
  		done();
  	}
  });
  
  afterEach(function() {
  });

  it("1) transforms js object with string id refs TO object refs", function() {
     var newModel = jsid.resolveIds(MOCK.objectModel1, MOCK.idRefResolver);
     expect(newModel.idref1.d).toBe("fred");
     expect(newModel.idref2.d).toBe("dave");
  });
  
  it("2) transforms js object with object refs TO string id refs",function(){
     var newModel = jsid.applyIds(MOCK.objectModel2, MOCK.idRefResolver);
     expect(newModel.idref1).toBe("IDREF:myIDType:123");
     expect(newModel.idref2).toBe("IDREF:myIDType:345");
  });
  
});

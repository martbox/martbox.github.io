
describe("url-utils spec", function() {

  var loaded = false;

  var MOCK = {

  };
  
  
  beforeEach(function(done) {
  	if(loaded===false) {
	  	require(['url-utils'], function(){
	  		loaded = true;
	  		window.URL = mbx.URL;
	  		done();
	  	});
  	}
  	else {
  		done();
  	}
  });
  
  afterEach(function() {
  });

  it("1) completes absolute url from relative url two folders above the current url", function() {
	var absUrl = URL.getAbsoluteUrl("http://host:port/root/path/resource.html", "../../newResource.html");
	expect(absUrl).toBe("http://host:port/newResource.html");
  });
  
    it("2) completes absolute url from relative url two folders under the current url", function() {
	var absUrl = URL.getAbsoluteUrl("http://host:port/root/path/resource.html", "path2/path3/newResource.html");
	expect(absUrl).toBe("http://host:port/root/path/path2/path3/newResource.html");
  });

it("3) completes absolute url from relative url in the same folder as the current url", function() {
	var absUrl = URL.getAbsoluteUrl("http://host:port/root/path/resource.html", "newResource.html");
	expect(absUrl).toBe("http://host:port/root/path/newResource.html");
	absUrl = URL.getAbsoluteUrl("http://host:port/root/path/resource.html", "./newResource.html");
	expect(absUrl).toBe("http://host:port/root/path/newResource.html");
  });
  
  it("4) completes absolute url from relative url under host url", function() {
	var absUrl = URL.getAbsoluteUrl("http://host:port/root/path/resource.html", "/newPath/newResource.html");
	expect(absUrl).toBe("http://host:port/newPath/newResource.html");
	var absUrl = URL.getAbsoluteUrl("http://host:port", "newPath/newResource.html");
	expect(absUrl).toBe("http://host:port/newPath/newResource.html");
  });
  
  it("5) completes absolute url from relative url keeping query string unchanged", function() {
	var absUrl = URL.getAbsoluteUrl("http://host:port/root/path/resource.html", "/newPath/newResource.html?param=../../something");
	expect(absUrl).toBe("http://host:port/newPath/newResource.html?param=../../something");
  });

});

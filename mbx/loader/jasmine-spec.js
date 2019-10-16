
var Loader = mbx.Loader;

describe("Loader...", function() {

  beforeEach(function() {
  	top.testJS1_evaluated = null;
  	top.testJS2_evaluated = null;
  	top.testJS3_evaluated = null;
  });
  
  afterEach(function() {
    //clear response cache
    Loader.prototype.RESOURCES={};
  });

  
    it("processesJSFilesInSequence", function(done) {
  		Loader.load(["test/test3.js", "test/test1.js", "test/test2.js"], function(scripts){
  		
  		expect(scripts[1].content).toEqual("LOADED VIA SCRIPT TAG");
  		expect(scripts[2].content).toEqual("LOADED VIA SCRIPT TAG");
  		expect(scripts[0].content).toEqual("LOADED VIA SCRIPT TAG");
  		
  		expect(top.testJS3_evaluated).toBe(null); //because 1 and 2 weren't run yet at eval time
  		expect(top.testJS1_evaluated).toBe(true);
  		expect(top.testJS2_evaluated).toBe(true);
  		done();
      });
    });
  
    
    it("cachesResponsesByUrl", function(done){
      Loader.load(["test/test1.js"], function(scriptsA){
        Loader.load(["test/test1.js"], function(scriptsB){
          expect(scriptsA.length).toBe(1);
          expect(scriptsB.length).toBe(1);          
          expect(scriptsA[0].content).toBe(scriptsB[0].content); //same content
          expect(scriptsA[0]).toBe(scriptsB[0]); //point to same object
          done();  
        });
      });
    });
  
  
    it("loadsHTML", function(done){
      Loader.load(["test/test.html"], function(resources){
          expect(resources.length).toBe(1);
          expect(resources[0].content).toEqual("<div class=\"namespace-class\">test html snippet</div>");
          done(); 
      }, false);
    });
    
    it("appendsHTMLToDIV", function(done){
      Loader.load(["test/test.html"], function(resources){
          expect(resources.length).toBe(1);
          expect(resources[0].content.tagName).toEqual("DIV");
          expect(resources[0].content.innerHTML).toEqual("<div class=\"namespace-class\">test html snippet</div>");
          done(); 
      });
    });
    
    it("loadsCSS", function(done){
      Loader.load(["test/test.css"], function(resources){
          expect(resources.length).toBe(1);
          expect(resources[0].content).toEqual(".namespace-class {color: blue;}\n");
          done(); 
      }, false);
    });
    
    it("loadsJSON", function(done){
        Loader.load(["test/test.json"], function(resources){
            expect(resources.length).toBe(1);
            expect(resources[0].content.test).toEqual("json");
            done(); 
        });
      });
  
});

runJasmine(); //start running only when this spec is ready

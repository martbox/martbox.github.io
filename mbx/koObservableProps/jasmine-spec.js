describe("observableProps add-on for knockout", function() {

  beforeEach(function() {

  });
  
  afterEach(function() {

  });

  
    it("constructs an object with observable and observableArray properties", function(done) {
      var obj1 = {a:123, b:"abc"};
      var obj2 = ko.observableProps(obj1);
      
      expect(obj2.a()).toBe(123);
      expect(obj2.b()).toBe("abc");
      done();
    });
    
    it("lets you update properties as observables", function(done) {
      var obj1 = {a:123, b:"abc"};
      var obj2 = ko.observableProps(obj1);
      obj2.a(345);
      obj2.b("def")
      
      expect(obj2.a()).toBe(345);
      expect(obj2.b()).toBe("def");
      done();
    });
    
    it("lets you update all child observables via optional set/get functions", function(done) {
      var obj1 = {a:123, b:"abc"};
      var obj2 = ko.observableProps(obj1, true);
      obj2.a.set(345);
      obj2.b.set("def")
      
      expect(obj2.a.get()).toBe(345);
      expect(obj2.b.get()).toBe("def");
      done();
    });
    
    it("lets you update all child observables at once using values from another object", function(done) {
      var obj1 = {a:123, b:"abc"};
      var obj2 = ko.observableProps(obj1);
      obj2({a:345, b:"def"});
      
      expect(obj2.a()).toBe(345);
      expect(obj2.b()).toBe("def");
      done();
    });

});
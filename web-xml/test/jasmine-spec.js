
describe("xs-parser spec", function() {

  XSDocSpec.logging = true;
  var XML_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";

  var MOCK = {
  };
  
  beforeEach(function() {

  });
  
  afterEach(function() {
  });

  function syncGet(url, success){
  	$.ajax({
  		async:false,
  		url:url,
  		success:success
  	});
  }

  it("1a) loads a basic xsd into a docspec", function() {
	syncGet('test1.xsd',
			 function(data, textStatus, jqXHR ){
				 var parser = new XSParser();
				 var docspec = parser.parseXSD(data);
				 expect(docspec.elementSpecs.root).not.toBeNull();
			 });
  });

  it("1b) loads a basic xsd into a docspec, validating xml", function() {
  syncGet('test1.xsd',
       function(data, textStatus, jqXHR ){
         var parser = new XSParser();
         var docspec = parser.parseXSD(data);
         var errors = docspec.validate(XML_HEADER+"<root xmlns=\"myNS\">hcjhchjc</root>");
         expect(errors.length).toBe(0);
         errors = docspec.validate(XML_HEADER+"<roof xmlns=\"myNS\">hcjhchjc</roof>");
         expect(errors.length).toBe(1);
         expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.UNEXPECTED_ROOT_ELEMENT);         
       });
  });

  it("2) validates against xsd with referred complex type and referred regex simple type attribute", function() {
  syncGet('test2.xsd',
       function(data, textStatus, jqXHR ){
         var parser = new XSParser();
         var docspec = parser.parseXSD(data);
         var errors = docspec.validate(XML_HEADER+"<root xmlns=\"myNS\" fruit=\"orange\"></root>");         
         expect(errors.length).toBe(0);
         
         errors = docspec.validate(XML_HEADER+"<root xmlns=\"myNS\"></root>");
         expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.MISSING_REQUIRED_ATTRIBUTE);
                  
         errors = docspec.validate(XML_HEADER+"<root xmlns=\"myNS\" fruit=\"pear\"></root>");
         expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.VALUE_REGEX_MISMATCH);
                  
         errors = docspec.validate(XML_HEADER+"<root xmlns=\"myNS\" mood=\"happy\"></root>");
         expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.UNEXPECTED_ATTRIBUTE);
         expect(errors[1].warningId).toEqual(XSDocSpec.ERROR.MISSING_REQUIRED_ATTRIBUTE);       
       });
  });


  it("3) validates number, boolean, date and enum simple types elements", function() {
  syncGet('test3.xsd',
       function(data, textStatus, jqXHR ){
          var parser = new XSParser();
          var docspec = parser.parseXSD(data);
          
          //all ok
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";
          xml += "<boolean>false</boolean>";
          xml += "<date>2017-12-10</date>";
          xml += "</root>";
          var errors = docspec.validate(xml);         
          expect(errors.length).toBe(0);
                   
          //invalid values
          xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>dbfsfgn</number>";
          xml += "<boolean>erg</boolean>";
          xml += "<date>trhtrh</date>";
          xml += "</root>";
          errors = docspec.validate(xml);          
          expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.VALUE_NOT_A_NUMBER);
          expect(errors[1].warningId).toEqual(XSDocSpec.ERROR.VALUE_NOT_A_BOOLEAN);
          expect(errors[2].warningId).toEqual(XSDocSpec.ERROR.VALUE_NOT_A_DATE);
       });
  });

  it("4) validates elements in a sequence group, also using element max/min occurs values", function() {
  syncGet('test4.xsd',
       function(data, textStatus, jqXHR ){
       	  var parser = new XSParser();
          var docspec = parser.parseXSD(data);
       	
          //all ok
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";  //optional instance
          xml += "<boolean>false</boolean>";  //must be 1 instance
          xml += "<date>2017-12-10</date>";  //2 or 3 instances
          xml += "<date>2017-12-11</date>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);
          
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          //xml += "<number>3</number>";  //missing optional element
          xml += "<boolean>false</boolean>";
          xml += "<date>2017-12-10</date>";
          xml += "<date>2017-12-11</date>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);
          
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          //xml += "<number>3</number>";
          //xml += "<boolean>false</boolean>"; //missing mandetory element
          xml += "<date>2017-12-10</date>";
          xml += "<date>2017-12-11</date>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(1);
          expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.INVALID_CHILD_ELEMENTS);
          
          //ok with 3 date elements
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";  //optional instance
          xml += "<boolean>false</boolean>";  //must be 1 instance
          xml += "<date>2017-12-10</date>";  //2 or 3 instances
          xml += "<date>2017-12-11</date>";
          xml += "<date>2017-12-12</date>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);
          
          //fails with 4 date elements
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";  //optional instance
          xml += "<boolean>false</boolean>";  //must be 1 instance
          xml += "<date>2017-12-10</date>";  //2 or 3 instances
          xml += "<date>2017-12-11</date>";
          xml += "<date>2017-12-12</date>";
          xml += "<date>2017-12-13</date>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(1);       
          expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.UNEXPECTED_CHILD_ELEMENT);   
          
          //fails with 1 date element
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";  //optional instance
          xml += "<boolean>false</boolean>";  //must be 1 instance
          xml += "<date>2017-12-10</date>";  //2 or 3 instances
          //xml += "<date>2017-12-11</date>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(1);       
          expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.INVALID_CHILD_ELEMENTS);  
       });
  });

  it("5) validates elements in a choice group, also using element max/min occurs values", function() {
  syncGet('test5.xsd',
       function(data, textStatus, jqXHR ){
          var parser = new XSParser();
          var docspec = parser.parseXSD(data);
        
          //all ok
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";
          //xml += "<boolean>false</boolean>";  //must be 2 instances
          //xml += "<boolean>true</boolean>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);
          
          //all ok
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
         // xml += "<number>3</number>";
          xml += "<boolean>false</boolean>";  //must be 2 instances
          xml += "<boolean>true</boolean>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);

          //fails if both choices are present
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";
          xml += "<boolean>false</boolean>";  //must be 2 instances
          xml += "<boolean>true</boolean>";
          xml += "</root>";
          var errors = docspec.validate(xml);
          expect(errors.length).toBe(2);       
          expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.UNEXPECTED_CHILD_ELEMENT);
          expect(errors[1].warningId).toEqual(XSDocSpec.ERROR.UNEXPECTED_CHILD_ELEMENT); 

       });
  });


  it("6) validates a choice of two referred groups containing sequences of one element", function() {
  syncGet('test6.xsd',
       function(data, textStatus, jqXHR ){
          var parser = new XSParser();
          var docspec = parser.parseXSD(data);
                
          //all ok
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";
          //xml += "<boolean>false</boolean>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);
          
          //all ok
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
         // xml += "<number>3</number>";
          xml += "<boolean>false</boolean>";
          xml += "</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);

          //fails if both choices are present
          var xml = XML_HEADER+"<root xmlns=\"myNS\">";
          xml += "<number>3</number>";
          xml += "<boolean>false</boolean>";
          xml += "</root>";
          var errors = docspec.validate(xml);
          expect(errors.length).toBe(1);       
          expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.UNEXPECTED_CHILD_ELEMENT);

       });
  });

  it("7) validates root element againts referred simple type with enum restriction", function() {
  syncGet('test7.xsd',
       function(data, textStatus, jqXHR ){
          var parser = new XSParser();
          var docspec = parser.parseXSD(data);   
          
          console.log(docspec);
                 
          //all ok
          var xml = XML_HEADER+"<root xmlns=\"myNS\">abc</root>";
          var errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);
          //all ok
          xml = XML_HEADER+"<root xmlns=\"myNS\">def</root>";
          errors = docspec.validate(xml);                 
          expect(errors.length).toBe(0);          
          //illegal value
          xml = XML_HEADER+"<root xmlns=\"myNS\">123</root>";
          errors = docspec.validate(xml);                 
          expect(errors.length).toBe(1);
          expect(errors[0].warningId).toEqual(XSDocSpec.ERROR.VALUE_INVALID);
       });
  });

  xit("8) validates complex type extension", function() {
  syncGet('test8.xsd',
       function(data, textStatus, jqXHR ){
          //TODO
       });
  });

  xit("9) validates complex type restriction", function() {
  syncGet('test9.xsd',
       function(data, textStatus, jqXHR ){
          //TODO
       });
  });

});

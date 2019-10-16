
/*
data..
	xsDocSpec.elementSpecs
	xsDocSpec.elementGroups
	xsDocSpec.simpleTypes	
    xsDocSpec.getSchemaBasedElementName(eName)
    
types..
	XSDocSpec.SimpleType = SimpleType;
	XSDocSpec.AttributeSpec = AttributeSpec;
	XSDocSpec.ElementSpec = ElementSpec;
	XSDocSpec.ElementGroup = ElementGroup;

/////////

xonomy jsxml element/attribute objects have..
 parent() : returns/constructs parent elment js object (above) or element owning the attribute
 type : "element" | "attribute" | "text"
 name : "element/attribute name (nodeName)"
 value : "attribute or text node value"
 htmlID : ""   //dom ID, populated only when harvested from xonomy editor UI (I think)
 attributes : []  array of {type: "attribute", name:"whatever" , value:"something" , htmlID:"", parent:function(){return elementJs}, }
 children : []  array of child element/text js objects
 
 //xonomy jsxml element objects also have util methods..
 hasAttribute()
 getAttribute()
 getAttributeValue()
 hasChildElement()
 getChildElements()
 getDescendentElements()
 getText()


xs-parser ElementSpec has...
    attributeSpecs = {};  //name : AttributeSpec
    self.attributes = self.attributeSpecs; //as used by Xonomy itself
    self.canDropTo = [];  //array of qualified element names this one can be dropped into  
    //my extensions
    attributeGroups = {};
    tooltip = "";  //tooltip help text
    allowMixed = false; //not sure xonomy handles adding text/element nodes as children together???
    getDefault = function(){return ""};
    elementGroup = null; // new ElementGroup();
    simpleType = new SimpleType.String();

xs-parser ElementGroup(name, type, minOccurs, maxOccurs)  //for ALL, CHOICE, SEQUENCE, GROUP, GROUP_REF, ELEMENT
    type = type || ElementGroup.TYPE.ELEMENT;  //see ElementGroup.TYPE
    groupName = name || ""; //group name or element qualified name for the ELEMENT type (effectively element type reference)   
    refName =  null; //name of another element group this group refers to  (same as groupName for reference type group)  
    minOccurs = typeof minOccurs != "undefined" ? minOccurs : 1;
    maxOccurs = typeof maxOccurs != "undefined" ? maxOccurs : 1;
    childGroups = []

xs-parser AttributeSpec has..
    tooltip = ""; //used as tooltip text, taken from xsd:annotation/xsd:documentation in schema
    required = false;
    defaultValue = "";
    fixedValue = null;
    simpleType = new SimpleType.String();
    name = null; //optional, useful if AttributeSpec only used for a single named attribute 
    setType(simpleType)
    clone = function returns new instance with identical properties to this attribute spec

*/

/**
 * Tool for parsing an xml schema file into a docspec object using xs-docspec.js
 * 
 * Use..
 * parseXSD(xsdContent)
 * or..
 * parseXSDFromUrl(xsdUrl)
 * 
 */
var XSParser = function(){
var self = this;

if(typeof Xonomy=="undefined" || Xonomy==null) {
	throw "mbx-xonomy.js should be loaded in the page before xsd2docspec.js";
}
if(typeof XSDocSpec=="undefined" || XSDocSpec==null) {
	throw "xs-docspec.js should be loaded in the page before xsd2docspec.js";
}

//used for obtaining namespace prefixed versions of names for xsd elements, attributes and simple types
var xs = {
	element:{},
	attribute:{}, // <-- not actually ns prefixed but convenient having this here as well
	type:{}	
};

var xsElementNames = [
	"schema",
	"import",
	"complexType",
	"simpleType",
	"element",
	"attribute",
	"group",
	"sequence",
	"choice",
	"all",
	"complexContent",
	"extension",
	"restriction",
	"annotation",
	"pattern",
	"enumeration"
];

var xsAttributeNames = [
  "targetNamespace",
  "namespace",
  "schemaLocation",
	"name",
	"substitutionGroup",
	"value",
	"base",
	"ref",
	"maxOccurs",
	"minOccurs",
	"type",
	"use",
	"mixed",
	"default",
	"fixed",
	"form",
	"id"
];

var xsSimpleTypeNames = [
	"string",
	"boolean",
	"byte",
	"decimal",
	"float",
	"integer",
	"int",
	"date"
];


function isPermittedChild(parentElName, childElName){
	  var permitted = false;
	  var permittedChildGroupNames = [];
    if(parentElName==xs.element.all) {
      permittedChildGroupNames = [xs.element.element];
    }
    else if(parentElName==xs.element.choice) {
      permittedChildGroupNames = [xs.element.element, xs.element.group, xs.element.choice, xs.element.sequence];
    }
    else if(parentElName==xs.element.group) {
      permittedChildGroupNames = [xs.element.all, xs.element.choice, xs.element.sequence];
    }
    else if(parentElName==xs.element.sequence) {
      permittedChildGroupNames = [xs.element.element, xs.element.group, xs.element.choice, xs.element.sequence];
    }
    if(permittedChildGroupNames.indexOf(childElName)>-1) {
    	permitted = true;
    }
    return permitted;
};

var seed=0;
function getNewName(){
	return "refName_"+(++seed);
}

function getJSElementPath(xonomyJSElement) {
	if(xonomyJSElement.parent()) {
		return getJSElementPath(xonomyJSElement.parent()) + "/" + xonomyJSElement.name
	}
	else {
		return xonomyJSElement.name;
	}
}

//returns plain element name, with no namespace prefix
function getNCName(elementName) {
	var i = elementName.indexOf(':');
	if(i>-1) {
		return elementName.substring(i+1);
	}
	return elementName;
}


function getBuiltInSimpleType(type) {
	  var simpleType = null;
    var numberTypes = [xs.type["int"], xs.type["integer"], xs.type["float"], xs.type["decimal"], xs.type["byte"]];
    if(numberTypes.indexOf(type) > -1) {
      simpleType = new XSDocSpec.SimpleType.Number();
    }
    else if(type == xs.type.string) {
      simpleType = new XSDocSpec.SimpleType.String();
    }
    else if(type == xs.type["boolean"]) {
      simpleType = new XSDocSpec.SimpleType.Boolean();
    }
    else if(type == xs.type.date) {
      simpleType = new XSDocSpec.SimpleType.Date();
    }
    else if(type == "xml.lang") {
      simpleType = new XSDocSpec.SimpleType.String();
    }
    return simpleType;
}

var elementParsers = {};

	//get the documentation child element text from annotation element
elementParsers.annotation = function(element, parentElement, ctx) {
	var documentationEl = element.getChildElements()[0];
	if(documentationEl)
		return documentationEl.getText();
	return "";
};

elementParsers.schema = function(element, parentElement, ctx) {
	var targetNamespace = element.getAttributeValue(xs.attribute.targetNamespace, null);
	if(targetNamespace) {
		  var targetNSPrefix = ""; 
		  for(var nsAtt in ctx.docspec.namespaces) {
		    if(ctx.docspec.namespaces[nsAtt] == targetNamespace) {
		      targetNSPrefix = nsAtt.indexOf("xmlns:")!=-1 ? nsAtt.substring(6) : "";
		    }		    
		  }
		ctx.refsToComplete.targetNSPrefix = targetNSPrefix;
	}
	element.getChildElements().forEach(function(childEl){
		if(!elementParsers[childEl.name]) {
      console.warn("skipping unsupported schema element: "+childEl.name);
    }
    else {
      elementParsers[childEl.name](childEl, element, ctx);
    }
	});
};

//<xsd:import namespace="http://www.bond.co.uk/UserGroup_1.0" schemaLocation="../domain/UserGroup_1.0.xsd"  />
//TODO load other docspecs from other urls, store against namespace prefix in this docspec? 
elementParsers['import'] = function(element, parentElement, ctx) {
  var targetNamespace = element.getAttributeValue(xs.attribute.namespace, null);
  var schemaLocation = element.getAttributeValue(xs.attribute.schemaLocation, null);
  if(schemaLocation) {
  	  $.ajax({
        async:false,
        url:schemaLocation,
        success:function(content){
        	var docspec = parseXSD(content)
        	ctx.docspec.imports[targetNamespace] = docspec;
        }
      });
  }
  
};

//returns ElementSpec built from child extension/restriction element
elementParsers.complexContent = function(element, parentElement, ctx){
  var childEl = element.getChildElements()[0]; //only one child anyway: extension or restriction
  var elementSpecOrRef = elementParsers[childEl.name](element, parentElement, ctx);
  return elementSpecOrRef;
};

//returns ElementSpec built from child extension/restriction element
elementParsers.simpleContent = function(element, parentElement, ctx){
  //extension or restriction child element
  var childEl = element.getChildElements()[0]; //only one child anyway: extension or restriction
  var elementSpecOrRef = elementParsers[childEl.name](element, parentElement, ctx);
  return elementSpecOrRef;
};

//extension or restriction, defaults to extension type.
var DerivedComplexType = function(refName, type){
	this.refName = refName; //extension/restriction types don't have a referable name, so invent one.
	this.type = type || xs.element.extension;
	this.expectedChildElementCount = 0; //3 attribute elements need parsing
	this.baseElementSpec = null;
	//one (group|all|choice|sequence)? or many (attribute)* (attribute groups expanded already here)
	this.complexContentType = null; //for extending complex content (child elements AND attributes)
	this.simpleContentAttributes = [];  //for extending element attributes only
}
DerivedComplexType.prototype.isComplete = function(){
    if(this.baseElementSpec!=null && this.expectedChildElementCount == (this.simpleContentAttributes.length + Number(this.complexContentType!=null))) {
      return true;
    }
    return false;
}
//we've got all the bits we need to construct the new derived version..
DerivedComplexType.prototype.makeElementSpecIfComplete = function(ctx){
	if(!this.isComplete()) {
		return;
	}
	var self = this;
	var newElementSpec = self.baseElementSpec.clone();
  if(self.type==xs.element.extension) {
  	if(self.baseElementSpec.elementGroup==null) { //extending a simple content 
  	  self.simpleContentAttributes.forEach(function(attSpec){
  	  	newElementSpec.attributeSpecs[attSpec.name] = attSpec;
  	  });
  	}
  	else { //extending a complex content
      var extensionElementSpec = self.complexContentType;
      //root element group types must match
      if(self.baseElementSpec.elementGroup.type!=extensionElementSpec.elementGroup.type) {
      	throw "Parsing error, extension type "+extensionElementSpec.name+" isn't compatible with base type "+self.baseElementSpec.name;
      }
      //add additional child element groups under main elementGroup
      extensionElementSpec.elementGroup.childGroups.forEach(function(childGroup){
      	newElementSpec.elementGroup.childGroups.push(childGroup);
      });
      
      //add/replace attribute specs
      for(var attName in extensionElementSpec.attributeSpecs) {
      	var attSpec = extensionElementSpec.attributeSpecs[attName];
        newElementSpec.attributeSpecs[attName] = attSpec;
      }
  	}
  }
  else if(self.type==xs.element.restriction) {
    if(self.baseElementSpec.elementGroup==null) { //restricting simple content
      self.simpleContentAttributes.forEach(function(attSpec){
      	if(newElementSpec.attributeSpecs[attSpec.name]) { //replace attribute specs
      		newElementSpec.attributeSpecs[attSpec.name] = attSpec;
      	}
      });
    }
    else { //restricting a complex type
      var restrictionElementSpec = self.complexContentType;
      //root element group types must match
      if(self.baseElementSpec.elementGroup.type!=restrictionElementSpec.elementGroup.type) {
        throw "Parsing error, restriction type "+restrictionElementSpec.name+" isn't compatible with base type "+self.baseElementSpec.name;
      }
      //add child element groups under main elementGroup, replacing all original ones
      newElementSpec.elementGroup.childGroups = [];
      restrictionElementSpec.elementGroup.childGroups.forEach(function(childGroup){
        newElementSpec.elementGroup.childGroups.push(childGroup);
      });
      
      //replace attribute specs
      for(var attName in restrictionElementSpec.attributeSpecs) {
        var attSpec = restrictionElementSpec.attributeSpecs[attName];
        if(newElementSpec.attributeSpecs[attName]) {
        	newElementSpec.attributeSpecs[attName] = attSpec;
        }        
      }
    }
  }
  //tell waiting referring elements this onject is ready to use
  ctx.refsToComplete.foundObject(self.refName, self.type, newElementSpec);
	return newElementSpec;
}


/**
Parser for xs.element.extension and xs.element.restriction
*/
function derivation(element, parentElement, ctx){
  var baseTypeName = element.getAttributeValue(xs.attribute.base, null);
  var refName = getNewName(); //derivation elements don't have a name attribute so make one
  var derivationRef = new ObjectReference(refName, element.name);  
  var derivedComplexType = new DerivedComplexType(refName, element.name);

  element.getChildElements().forEach(function(childEl){
  	derivedComplexType.expectedChildElementCount++; //count how many child elements we're expecting to parse
  	
  	if(childEl.name==xs.element.attribute) { //collect extending/restricted attributes
  		var attributeSpecOrRef = elementParsers[childEl.name](childEl, element, ctx);
      ctx.callWhenFound(attributeSpecOrRef, function(attSpec){
        derivedComplexType.simpleContentAttributes.push(attSpec);
        derivedComplexType.makeElementSpecIfComplete();
      }, getJSElementPath(element)); 
  	}
  	else if(childEl.name==xs.element.attributeGroup) { //collect extending/restricted attribute groups
      var attGrpOrRef = elementParsers[childEl.name](childEl, element, ctx);
      ctx.callWhenFound(attGrpOrRef, function(attGrpSpec){
      	for(var attName in attGrpSpec.attributeSpecs) {
      		if(attGrpSpec.attributeSpecs.hasOwnProperty(attName)) {
      	    derivedComplexType.simpleContentAttributes.push(attGrpSpec.attributeSpecs[attName]);
      		}
      	}
        derivedComplexType.makeElementSpecIfComplete();
      }, getJSElementPath(element)); 
    }
    //collect extending/restricted list of grouping elements
    else if(childEl.name in [xs.element.group, xs.element.all, xs.element.choice, xs.element.sequence]) {
      var elementSpecOrRef = elementParsers[childEl.name](childEl, element, ctx);
      ctx.callWhenFound(elementSpecOrRef, function(elementSpec){
        derivedComplexType.complexContentType = elementSpec;
        derivedComplexType.makeElementSpecIfComplete();
      }, getJSElementPath(element));      
    }
    else {
    	derivedComplexType.expectedChildElementCount--; //skip unexpected element
    }
  });
  
  function baseElementSpecFound(elementSpec){
    derivedComplexType.baseElementSpec = elementSpec;
    if(derivedComplexType.isComplete()) {
       var elSpec = derivedComplexType.makeElementSpec();
       ctx.refsToComplete.foundObject(refName, element.name, elSpec);
    }
  }
  
  //when base type referred to is a complex type
  ctx.callWhenFound(new ObjectReference(baseTypeName, xs.element.complexType), baseElementSpecFound, getJSElementPath(element));
  
  return derivationRef;
};
elementParsers.extension = derivation;
elementParsers.restriction = derivation;



/**
<xs:simpleType >
@return {XSDocSpec.SimpleType}
*/
elementParsers.simpleType = function(element, parentElement, ctx) {
		var name = element.getAttributeValue(xs.attribute.name, getNewName()); //use a generated name if missing
		var simpleTypeObjOrRef = new ObjectReference(name, xs.element.simpleType);
		
		var tooltip = "";
		var restrictionBase = xs.type.string;
		var regexPattern = null;
		var enumValues = null;
		var maxLength = null;
		var minLength = null;
		var minInclusive = null;
		var maxInclusive = null;
		
		//collect the tooltip text and restriction information
		element.getChildElements().forEach(function(childEl){			
			if(childEl.name==xs.element.annotation) {
				tooltip = elementParsers.annotation(childEl);
			}
			else if(childEl.name == xs.element.restriction) {
				restrictionBase = childEl.getAttributeValue(xs.attribute.base, null);
				childEl.getChildElements().forEach(function(el){
					if(el.name==xs.element.pattern) {
						regexPattern = el.getAttributeValue(xs.attribute.value, null);
					}
					else if(el.name==xs.element.enumeration) {
						if(enumValues==null)
							enumValues = [];
						enumValues.push(el.getAttributeValue(xs.attribute.value, null));
					}
					else if(el.name==xs.element.maxLength) {
						maxLength = Number(el.getAttributeValue(xs.attribute.value, null));
					}
					else if(el.name==xs.element.minLength) {
						minLength = Number(el.getAttributeValue(xs.attribute.value, null));
					}
					else if(el.name==xs.element.minInclusive) {
						minInclusive = Number(el.getAttributeValue(xs.attribute.value, null));
					}
					else if(el.name==xs.element.maxInclusive) {
						maxInclusive = Number(el.getAttributeValue(xs.attribute.value, null));
					}
				});
			}
		});
				
				
		function completeSimpleTypeFromBaseType(baseSimpleType){
			var newSimpleType = new XSDocSpec.SimpleType.String(); //string / boolean / number / date / enum
			switch(baseSimpleType.type) {
				case "string" : newSimpleType = new XSDocSpec.SimpleType.String(regexPattern); break;
				case "boolean" : newSimpleType = new XSDocSpec.SimpleType.Boolean(); break;
				case "number" : newSimpleType = new XSDocSpec.SimpleType.Number(minInclusive, maxInclusive); break;
				case "date" : newSimpleType = new XSDocSpec.SimpleType.Date(); break;
				default:
			}			
			if(enumValues!=null) {
	      newSimpleType = new XSDocSpec.SimpleType.Enumeration(enumValues, baseSimpleType);
	    }	    
	    if(name!=null) { //register on the docspec and trigger any waiting callbacks..
	      ctx.docspec.simpleTypes[name] = newSimpleType;	      
	      ctx.refsToComplete.foundObject(name, xs.element.simpleType, newSimpleType);	      
	    }
	    simpleTypeObjOrRef = newSimpleType;
		}
					
		var baseSimpleType = getBuiltInSimpleType(restrictionBase);
		if(baseSimpleType!=null) {
			completeSimpleTypeFromBaseType(baseSimpleType);
		}
		else { //its based on a custom referenced simple type   
		  ctx.callWhenFound(new ObjectReference(restrictionBase, xs.element.simpleType), function(baseSimpleType){
        completeSimpleTypeFromBaseType(baseSimpleType);
      }, getJSElementPath(element));  
    }

		return simpleTypeObjOrRef;
	};
	
	
/**
parser for <xsd:complexType> elements    
@return {XSDocSpec.ElementSpec}
*/
elementParsers.complexType = function(element, parentElement, ctx) {
	//get attribute values
	var name = element.getAttributeValue(xs.attribute.name, null);
	var mixed = element.getAttributeValue(xs.attribute.mixed, false);
	
	//create docspec ElementSpec for this xsd complexType
	var elSpec = new XSDocSpec.ElementSpec();
	//elSpec.attributeSpecs = {};  //name : AttributeSpec
	elSpec.elementGroup = null; // new ElementGroup(); indicates expected child elements
	
	//adding extra bits for use in xs-parser so extension/restriction parsing 
	//can know when element spec is complete, i.e. ready to extend/restrict
	elSpec.childElementsLeftToParse = 0;
	elSpec.onCompleteSubscribers = [];
	elSpec.onComplete = function(callback){
		elSpec.onCompleteSubscribers.push(callback);
	};
	elSpec.tellSubscribersIfComplete = function(){
		if(elSpec.childElementsLeftToParse==0) {
			elSpec.onCompleteSubscribers.forEach(function(callback){
				callback(elSpec);
			});
		}
	};
	
	var validChildElements = [xs.element.sequence,
	 xs.element.choice, 
	 xs.element.all, 
	 xs.element.group, 
	 xs.element.attribute, 
	 xs.element.attributeGroup,
	 xs.element.simpleContent,
	 xs.element.complexContent];
	 
	element.getChildElements().forEach(function(childEl) {
		if(validChildElements.indexOf(childEl.name)>-1) {
			elSpec.childElementsLeftToParse++;
		}
	});
	
	element.getChildElements().forEach(function(childEl) {
			//use the child sequence/choice/all/group element to define the ElementGroup for this ElementSpec
			if([xs.element.sequence, xs.element.choice, xs.element.all, xs.element.group].indexOf(childEl.name)>-1) {
				var objOrRef = elementParsers[childEl.name](childEl, element, ctx);
				ctx.callWhenFound(objOrRef, function(obj){
					elSpec.elementGroup = obj;
					elSpec.childElementsLeftToParse--;
					elSpec.tellSubscribersIfComplete();
				}, getJSElementPath(element));
			}
			//add any parsed attribute elements to the element specs attributeSpecs object
			else if(childEl.name = xs.element.attribute) {
				var attSpecOrRef = elementParsers[childEl.name](childEl, element, ctx);
				ctx.callWhenFound(attSpecOrRef, function(attSpec){
					elSpec.attributeSpecs[attSpec.name] = attSpec;
					elSpec.childElementsLeftToParse--;
          elSpec.tellSubscribersIfComplete();
				}, getJSElementPath(element));				
			}
			//add any parsed attribute group elements to the element spec attributeGroups object
			else if(childEl.name = xs.element.attributeGroup) {
				var attGroupOrRef = elementParsers[childEl.name](childEl, element, ctx);
				ctx.callWhenFound(attGroupOrRef, function(attGroup){
					elSpec.attributeGroups[attGroup.name] = attGroup;
					elSpec.childElementsLeftToParse--;
          elSpec.tellSubscribersIfComplete();
				}, getJSElementPath(element));								
			}
			//if child element is simpleContent then parsing it returns the element spec we want
			else if(childEl.name = xs.element.simpleContent) {
				//extension/restriction base, then attribute attributeGroup child elements
				elSpec = elementParsers[childEl.name](childEl, element, ctx);
				elSpec.childElementsLeftToParse--;
        elSpec.tellSubscribersIfComplete();
			}
			//if child element is complexContent then parsing it returns the element spec we want
			else if(childEl.name = xs.element.complexContent) {
				//extension/restriction base, then complexType child elements
				elSpec = elementParsers[childEl.name](childEl, element, ctx);
				elSpec.childElementsLeftToParse--;
        elSpec.tellSubscribersIfComplete();
			}
			else { //unexpected/unsupported element
				elSpec.childElementsLeftToParse--;
			}
	});
	
	if(name) { //if this complexType has a name, add it to elementRefs so other elements can refer to it
		ctx.refsToComplete.foundObject(name, xs.element.complexType, elSpec);
	}
	return elSpec;
}
	

elementParsers.abstractElementGroup = function(element, parentElement, ctx) {
  var name = element.getAttributeValue(xs.attribute.name, getNewName());
  var ref = element.getAttributeValue(xs.attribute.ref, null);
  
  var objectOrRef = null;
  if(ref) { 
    objectOrRef = new ObjectReference(ref, element.name);
  }
  else {
    objectOrRef = new XSDocSpec.ElementGroup({
      name: name,
      type: getNCName(element.name), //<<-- matches ctx.docspec.ElementGroup.TYPE values anyway
      minOccurs: element.getAttributeValue(xs.attribute.minOccurs, 1),
      maxOccurs: element.getAttributeValue(xs.attribute.maxOccurs, 1)
    });
    console.log("Parsed ElementGroup "+objectOrRef.toString());
    
    objectOrRef.childGroups = new Array(element.getChildElements().length);
    element.getChildElements().forEach(function(childEl, i) {
      if(isPermittedChild(element.name, childEl.name)) {
        var childGroupOrRef = elementParsers[childEl.name](childEl, element, ctx);
        //add referenced child groups as and when discovered
        ctx.callWhenFound(childGroupOrRef, function(childGroup){
        	console.log("Adding child ElementGroup "+childGroup.toString()+" to "+objectOrRef.toString());
          objectOrRef.childGroups[i]=childGroup;
        }, getJSElementPath(element));         
      }
      else {
      	console.warn("Element '"+childEl.name+"' is not a child group of parent element '"+element.name+"'");
      }
    });
    
    if(name) {
      ctx.refsToComplete.foundObject(name, element.name, objectOrRef);
    }
  }
  
  return objectOrRef; 
}

/**
parser for <xsd:group> elements
@return {docspec.ElementGroup}
*/
elementParsers.group = function(element, parentElement, ctx) {  
  return elementParsers.abstractElementGroup(element, parentElement, ctx); 
}

elementParsers.sequence = function(element, parentElement, ctx) {
  return elementParsers.abstractElementGroup(element, parentElement, ctx); 
}

elementParsers.choice = function(element, parentElement, ctx) {
  return elementParsers.abstractElementGroup(element, parentElement, ctx);
}

elementParsers.all = function(element, parentElement, ctx) {
	return elementParsers.abstractElementGroup(element, parentElement, ctx);		
}

elementParsers.attribute = function(element, parentElement, ctx) {
	var attOrRef = null;
	var ref = element.getAttributeValue(xs.attribute.ref, null);
	var name = element.getAttributeValue(xs.attribute.name, null);
	
	if(ref) {
		attOrRef = new ObjectReference(ref, element.name);
	}
	else {
		attOrRef = new XSDocSpec.AttributeSpec();
	  var fixed = element.getAttributeValue(xs.attribute.fixed, null),
	      //form = element.getAttributeValue(xs.attribute.form, null),  //NOT SUPPORTED
	      //id = element.getAttributeValue(xs.attribute.id, null),   //NOT SUPPORTED
	      type = element.getAttributeValue(xs.attribute.type, null),
	      _default = element.getAttributeValue(xs.attribute["default"], null),
	      use = element.getAttributeValue(xs.attribute.use, null);
	  if(fixed)
	     attOrRef.fixedValue=fixed;
	  else if(_default)
	     attOrRef.defaultValue=_default;
	  if(use && (use=="required" || use=="REQUIRED")) {
	  	attOrRef.required=true;
	  }
	     
	  var builtInSimpleType = getBuiltInSimpleType(type);
	  if(builtInSimpleType) {
	  	attOrRef.setType(builtInSimpleType);
	  }
	  else {
	  	ctx.callWhenFound(new ObjectReference(type, xs.element.simpleType), function(simpleType){
	  		attOrRef.setType(simpleType);
	  	}, getJSElementPath(element));
	  }
	  if(name) {
	  	attOrRef.name = name;
	    ctx.refsToComplete.foundObject(name, element.name, attOrRef);
	  }
	}
	
  return attOrRef;
}


elementParsers.attributeGroup = function(element, parentElement, ctx) {
	var attGroupOrRef = null;
	 var ref = element.getAttributeValue(xs.attribute.ref, null);
   var name = element.getAttributeValue(xs.attribute.name, null);
   if(ref) {
   	 attGroupOrRef = new ObjectReference(ref, element.name);
   }
   else {
   	 attGroupOrRef = new XSDocSpec.AttributeGroup();
     
     element.getChildElements().forEach(function(childEl){      
      if(childEl.name==xs.element.attribute) {
        var attOrRef = elementParsers[childEl.name](childEl, element, ctx);
        ctx.callWhenFound(attOrRef, function(att){
        	attGroupOrRef.attributeSpecs[att.name] = att;
        }, getJSElementPath(element));
      }
      if(childEl.name==xs.element.attributeGroup) {
        var attGrpOrRef = elementParsers[childEl.name](childEl, element, ctx);
        ctx.callWhenFound(attGrpOrRef, function(attGrp){
          attGroupOrRef.attributeGroups[attGrp.name] = attGrp;
        }, getJSElementPath(element));
      }
     });
          
	   if(name!=null) {
	   	  attGroupOrRef.name = name;
	      ctx.refsToComplete.foundObject(name, element.name, attGroupOrRef);
	   }
   }
   return attGroupOrRef;   
}
	

//element name that can be substituted with an alias name
function SubstitutionGroup(name, alias, tooltip){
	this.name = name;
	this.alias = alias;
	this.tooltip = tooltip;
}

/*
this is two things, it returns an ElementGroup, and also registers an Element spec.
*/
elementParsers.element = function(element, parentElement, ctx) {
	//get attribute values
	var name = element.getAttributeValue(xs.attribute.name, "");
	var type = element.getAttributeValue(xs.attribute.type, null);
	var substitutionGroup = element.getAttributeValue(xs.attribute.substitutionGroup, null);
	
	if(substitutionGroup!=null && name!="") {
		console.log("Found element '"+name+"' with substitutionGroup '"+substitutionGroup+"'");
    ctx.substitutionGroups[substitutionGroup] = ctx.substitutionGroups[substitutionGroup] || [];
    ctx.substitutionGroups[substitutionGroup].push(name);
  }
	
	//create new ElementSpec for this element
	var elSpec = new XSDocSpec.ElementSpec();
	
	//Update element spec using data from parsed child elements
	element.getChildElements().forEach(function(childEl) {			
		if(childEl.name==xs.element.annotation) {
			elSpec.tooltip = elementParsers.annotation(childEl);
		}
		else if(childEl.name==xs.element.complexType && !type) {
			elSpec = elementParsers[childEl.name](childEl, element, ctx);
		}
		else if(childEl.name==xs.element.simpleType && !type) {			
			var simpleTypeObjOrRef = elementParsers[childEl.name](childEl, element, ctx);
			ctx.callWhenFound(simpleTypeObjOrRef, function(simpleType){
				elSpec.simpleType = simpleType;
			}, getJSElementPath(element));
		}
	});
	console.log("Found '"+name+"' element");
	ctx.docspec.elementSpecs[name] = elSpec;
	
	var simpleType = getBuiltInSimpleType(type);
	if(simpleType!=null) { //use standard simple type
		console.log("Setting built-in "+simpleType.type+" simpleType on '"+name+"' element.");
		elSpec.simpleType = simpleType;
	}
	else if(type) { //Update element spec using referenced complex or simple type if parsed, or defer until it is..
		var setReferredTypeFn = function(foundObj){
			if(XSDocSpec.SimpleType.isInstance(foundObj)) {
				console.log("Setting "+foundObj.type+" '"+type+"' simpleType on '"+name+"' element.");
				ctx.docspec.elementSpecs[name].simpleType = foundObj;
			}
			else if(foundObj instanceof XSDocSpec.ElementSpec) {
				console.log("Setting '"+type+"' complexType on '"+name+"' element.");
				var tooltip = elSpec.tooltip;
				ctx.docspec.elementSpecs[name] = foundObj;
				ctx.docspec.elementSpecs[name].tooltip = tooltip;
			}
		};		
		//we don't know which type it will be
		console.log("element '"+name+"' waiting for its type '"+type+"' to be parsed..");
		var simpleTypeObjRef  = new ObjectReference(type, xs.element.simpleType)
		var complexTypeObjRef = new ObjectReference(type, xs.element.complexType)
		ctx.callWhenFound(complexTypeObjRef, function(foundObj){
		  setReferredTypeFn(foundObj);
		  ctx.refsToComplete.removeObjRef(simpleTypeObjRef);
		}, getJSElementPath(element));

		ctx.callWhenFound(simpleTypeObjRef, function(foundObj){
		  setReferredTypeFn(foundObj);
		  ctx.refsToComplete.removeObjRef(complexTypeObjRef);
		}, getJSElementPath(element));
	}
	
	var elGroup = new XSDocSpec.ElementGroup({
		name: element.getAttributeValue(xs.attribute.name, ""),
		type: XSDocSpec.ElementGroup.TYPE.ELEMENT,
		minOccurs: element.getAttributeValue(xs.attribute.minOccurs, 1),
		maxOccurs: element.getAttributeValue(xs.attribute.maxOccurs, 1)
	});
	return elGroup;
};



//end of parser functions
/******************************************************************************************************************************************/


/**
Defines an object representing a reference to another named object that hasn't been found yet.
*/
function ObjectReference(name, elementType) {
	this.name = name;
	this.elementType = elementType;
}

/**
Registry of ObjectReferences waiting to be resolved to actual objects
Usage..
ctx.refsToComplete = new RefsToComplete();
ctx.refsToComplete.addUnresolvedObjectReference(name, elementType, objectReference);
ctx.refsToComplete.resolveReferences(elementType, namedObjects)
@see ObjectReference
*/
function RefsToComplete() {
	var self = this;
	self.targetNSPrefix = "";
	self.objectRefs = {};
	for(var elType in xs.element) {
		self.objectRefs[xs.element[elType]] = {};
	}
}
RefsToComplete.prototype.whenObjectFound=function(objRef, callback, waitingElementPath) {
	var name = objRef.name;
	var elementType = objRef.elementType;
  var refsForElType = this.objectRefs[elementType];
  if(!refsForElType[name]) {
  	refsForElType[name] = {callbacks:[], parsedObject:null};
  }
  if(refsForElType[name].parsedObject) { 
  	//already parsed the element with this ref name, so callback immediately
  	callback(refsForElType[name].parsedObject);
  }
  else { //we haven't parsed an element with this name yet, to register the callback for execution later..
    callback.waitingElementPath = waitingElementPath;
  	refsForElType[name].callbacks.push(callback);
  }
}
RefsToComplete.prototype.foundObject=function(name, elementType, object) {
	console.log("Found '"+name+"' "+elementType);
  var qualifiedName = this.targetNSPrefix.length>0 ? this.targetNSPrefix + ":" + name : name;
  var refsForElType = this.objectRefs[elementType];
  if(!refsForElType)
    return;
  if(!refsForElType[qualifiedName]) {
    refsForElType[qualifiedName] = {callbacks:[], parsedObject:object};
  }
  else {
  	refsForElType[qualifiedName].parsedObject = object;
  }
  //run the callbacks that were waiting for this object to be found
  refsForElType[qualifiedName].callbacks.forEach(function(callback){  	
  	callback(object);
  });
  refsForElType[qualifiedName].callbacks = [];
}
RefsToComplete.prototype.removeObjRef=function(objRef) {
	var name = objRef.name;
	var elementType = objRef.elementType;
  var refsForElType = this.objectRefs[elementType];
  if(refsForElType[name]) {
  	delete refsForElType[name];
  	console.log("Removed "+elementType+" '"+name+"' from unresolved object references list.");
  }
}
RefsToComplete.prototype.getUnresolvedRefs=function() {
	var unresolvedElTypes = null;
	for(var elTypeName in this.objectRefs) {
		var unresolved = false;
		var unresolvedRefNames = {};
		var includeThisOne = false;
		for(var refName in this.objectRefs[elTypeName]) {
      if(this.objectRefs[elTypeName][refName].parsedObject==null) {
      	unresolvedRefNames[refName] = this.objectRefs[elTypeName][refName];
      	includeThisOne = true;      	
      }
    }
    if(includeThisOne) {
    	 if(unresolvedElTypes==null)
    	    unresolvedElTypes = {};
    	unresolvedElTypes[elTypeName] = unresolvedRefNames;
    }
	}
	return unresolvedElTypes;
}


/**
A context instance is passed through all relevant parsing methods to collect overall parsed data
*/
function Context(xsdNSPrefix, docspec) {
	var self = this;
	self.xsdNSPrefix = xsdNSPrefix;
	self.docspec = docspec;

	//where a reference to a names element (e.g. a complexType) is parsed before the element it refers to
	//this is where these unresolved ObjectReference instances are places, for completing later
	self.refsToComplete = new RefsToComplete(); 
	
	//run a callback function with the given parameter as argument, unless its an object reference
	//in which case call it later when resolved.
	self.callWhenFound = function(objectOrObjectReference, callback, waitingElementPath) {
    if(objectOrObjectReference instanceof ObjectReference) { //set object[propertyName] later..
	    self.refsToComplete.whenObjectFound(objectOrObjectReference, callback, waitingElementPath);
	  }
	  else { //set object[propertyName] now..
	    callback(objectOrObjectReference);
	  }
	}
}


//prepend the xml schema namespace prefix (typically 'xs') to all relevant contants
function applyXSDNSPrefix(xsdNSPrefix) {
	for(var p in elementParsers) {
		elementParsers[xsdNSPrefix + ":" + p] = elementParsers[p];
	}
	xsElementNames.forEach(function(elName){
		xs.element[elName] = xsdNSPrefix + ":" + elName;
	});
	xsSimpleTypeNames.forEach(function(typeName){
		xs.type[typeName] = xsdNSPrefix + ":" + typeName;
	});
	xsAttributeNames.forEach(function(attName){
		xs.attribute[attName] = attName; //not namespace prefixed but still on xs object for convenience
	});	
}

//if named references have not been resolved by discovered xsd elements then defaults are applied here..
function applyDefaultsForUnresolvedReferences(ctx) {
	var unresolvedRefs = ctx.refsToComplete.getUnresolvedRefs();
  if(unresolvedRefs) {
    console.warn("Applying defaults for unresolved name references..");
		for(var elTypeName in unresolvedRefs) {
		    for(var refName in unresolvedRefs[elTypeName]) {
          switch(elTypeName) {
          	case xs.element.simpleType: 
          	  ctx.refsToComplete.foundObject(refName, elTypeName, new XSDocSpec.SimpleType.String());
          	  console.warn("Default String SimpleType used for unresolved reference name '"+refName+"'");
          	  break;
          	case xs.element.attribute: 
              ctx.refsToComplete.foundObject(refName, elTypeName, new XSDocSpec.AttributeSpec());
              console.warn("Default AttributeSpec used for unresolved reference name '"+refName+"'");
              break;
          	default:
          	  console.warn("Unresolved reference name: '"+refName+"' for type "+elementType);
          }
		    }
		}
  }
  else {
  	console.warn("All named xsd elements have been resolved.");
  }
}

//recursively replace all references to substitutable element names with a choice of the applicable aliases
function expandElementGroupsWithSubstituteElementNames(elementGroup, substituteNames){
	for(var i=0; i<elementGroup.childGroups.length; i++) {
		var childGroup = elementGroup.childGroups[i];
		if(typeof childGroup == "undefined") {
			break;
		}
		if(childGroup.type==XSDocSpec.ElementGroup.TYPE.ELEMENT) {
			
			var choice = new XSDocSpec.ElementGroup({
	      name: getNewName(),
	      type: XSDocSpec.ElementGroup.TYPE.CHOICE,
	      minOccurs: childGroup.minOccurs,
	      maxOccurs: childGroup.maxOccurs
	    });
	    
	    choice.addChild(childGroup);
	    
	    substituteNames[childGroup.name].forEach(function(alias){
	    	var element = new XSDocSpec.ElementGroup({
			    name: alias,
			    type: XSDocSpec.ElementGroup.TYPE.ELEMENT,
			    minOccurs: 1,
			    maxOccurs: 1
			  });
			  choice.addChild(element);			  
	    });
	    
	    //HERE NEXT, not getting hit...
	    console.log("expanded reference to element '"+childGroup.name+"' with "+substituteNames[childGroup.name]);
	    
	    elementGroup.childGroups[i] = choice;
		}
		else if(childGroup.childGroups.length>0) {
			elementGroup.childGroups[i] = expandElementGroupsWithSubstituteElementNames(childGroup, substituteNames);
		}
	}
	return elementGroup;
}

function applySubstitutionGroups(ctx) {
	//transform element specs element groups to use a choice of substitute element names where applicable
	console.log("applying substitution groups..");
	console.log(ctx.substitutionGroups);
	for(var p in ctx.docspec.elementSpecs) {
		var spec = ctx.docspec.elementSpecs[p];
		if(spec.elementGroup) {
			spec.elementGroup = expandElementGroupsWithSubstituteElementNames(spec.elementGroup, ctx.substitutionGroups);
		}
	}
}

//parse xsd content and return docspec js model
function parseXSD(xsdContent){
	var docspec = new XSDocSpec(); //new docspec we're going to be populating
	var jsRootEl = Xonomy.xml2js(xsdContent, null, docspec.namespaces); //parse xsdContent as general xml object structure
	
	//find the xml schema elements namespace prefix (typically xs or xsd)
	var xsdNSPrefix = "";	
	for(var nsAtt in docspec.namespaces) {
	  if(docspec.namespaces[nsAtt].indexOf("/XMLSchema")==docspec.namespaces[nsAtt].length-10) {
	    xsdNSPrefix = nsAtt.indexOf("xmlns:")!=-1 ? nsAtt.substring(6) : "";
	  }	  
	}
	applyXSDNSPrefix(xsdNSPrefix);

  docspec.namespaces["xmlns:xml"]="http://www.w3.org/XML/1998/namespace";

	var ctx = new Context(xsdNSPrefix, docspec); //create context object to gather parsed data in
	ctx.substitutionGroups = {name:[]}; // element names and their applicable substitutes
	elementParsers.schema(jsRootEl, null, ctx); //start parsing from the root schema element
	
	//post processing
	applyDefaultsForUnresolvedReferences(ctx);
	applySubstitutionGroups(ctx);
	ctx.docspec.build(); //build the xonomy UI parts now structural parts are complete

	return ctx.docspec;
}


return {
	parseXSD:parseXSD
};

};
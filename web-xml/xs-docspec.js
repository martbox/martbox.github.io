

/*

XSDocSpec..

var docspec = new XSDocSpec();
docspec.elementSpecs = {}; // element name or complex/simple type name : Element object
docspec.elementGroups = {}; //group name : ElementGroup object
docspec.simpleTypes = {}; //name : SimpleType instance object		
docspec.namespaces = {}; //from parsing of xml schema file (prefixes can be different to those used in xml instance doc)
docspec.createActionMenus();  //ALWAYS run this function after building a docspec

Attribute Spec..

var att = new XS.AttributeSpec();
att.asker = XONOMY_ASKER_FACTORY.NONE;  //fn asking for user input (string, long string, picklist)
att.menu = [], //array of MenuItem
att.isReadOnly = fnReturnFalse;
att.isInvisible = fnReturnFalse;
att.tooltip = ""; //used as tooltip text, taken from xsd:annotation/xsd:documentation in schema
att.required = false;
att.defaultValue = "";
att.fixedValue = null;
att.simpleType = new SimpleType.String();

Element Spec..

var elementSpec = new ElementSpec();
elementSpec.attributeSpecs = {};  //name : AttributeSpec
elementSpec.oneliner = fnReturnFalse;
elementSpec.hasText = fnReturnFalse;
elementSpec.localDropOnly = fnReturnFalse; //make always true?
elementSpec.tooltip = "";  //tooltip help text
elementSpec.allowMixed = false; //not sure xonomy handles adding text/element nodes as children together???
elementSpec.getDefault = function(){return ""}; //returns default simplest valid xml string for this element
elementSpec.elementGroup = null; // new ElementGroup(); indicates expected child elements
elementSpec.simpleType = new SimpleType.String(); indicates expected child text 

Simple Types..

new XS.SimpleType.String(regex)
new XS.SimpleType.Number(max, min)
new XS.Date()
new XS.Boolean()
new XS.Enumeration([values], XS.SimpleType.String )

Element Groups..
var group = new XS.ElementGroup(XS.ElementGroup.TYPE.####, minOccurs, maxOccurs)
group.groupName = "books"; //group name or element qualified name for the ELEMENT type (effectively element type reference)
group.refName =  null; //name of another element group this group refers to
group.childGroups = []; array of child ElementGroup objects (e.g. sequence OF choices OF elements)

Where XS.ElementGroup.TYPE.#### is one of..

XS.ElementGroup.TYPE.ELEMENT   //i.e. a single element type occuring 0 or more times
XS.ElementGroup.TYPE.ALL       //all child elements optional in any order, each no more than once.
XS.ElementGroup.TYPE.SEQUENCE
XS.ElementGroup.TYPE.CHOICE
XS.ElementGroup.TYPE.GROUP
XS.ElementGroup.TYPE.GROUP_REF

*/


var XSDocSpec = (function(){

if(typeof Xonomy=="undefined" || Xonomy==null) {
	throw "mbx-xonomy.js should be loaded in the page before xs-docspec.js";
}
		
	//private variables
	var WHILE_LOOP_LIMIT = 10000;
	
	function fnEmpty(){};
	function fnReturnFalse(){return false};
	function fnReturnTrue(){return true};
	function fnReturnEmptyString(){return ""};
	
	var PASTE_MODE = {
		BEFORE_ELEMENT: "before",
		CHILD_ELEMENT: "child",
		AFTER_ELEMENT: "after"
	};

	var ERROR = {
		VALUE_REGEX_MISMATCH:'VALUE_REGEX_MISMATCH',
		VALUE_INVALID:'VALUE_INVALID',
		VALUE_NOT_A_NUMBER:'VALUE_NOT_A_NUMBER',
		VALUE_MISSING:'VALUE_MISSING',
		VALUE_TOO_SMALL:'VALUE_TOO_SMALL',
		VALUE_TOO_LARGE:'VALUE_TOO_LARGE',
		VALUE_NOT_A_DATE:'VALUE_NOT_A_DATE',
		VALUE_NOT_A_BOOLEAN:'VALUE_NOT_A_BOOLEAN',
		UNEXPECTED_CHILD_ELEMENT:'UNEXPECTED_CHILD_ELEMENT',
		INVALID_CHILD_ELEMENTS:'INVALID_CHILD_ELEMENTS',
		UNEXPECTED_ROOT_ELEMENT:'UNEXPECTED_ROOT_ELEMENT',
		UNEXPECTED_ELEMENT:'UNEXPECTED_ELEMENT',
		UNEXPECTED_ATTRIBUTE:'UNEXPECTED_ATTRIBUTE',
		MISSING_REQUIRED_ATTRIBUTE:'MISSING_REQUIRED_ATTRIBUTE'
	};
	
	var XONOMY_ASKER_FACTORY = {
		NONE: function(){return fnReturnEmptyString},
		STRING: Xonomy.getStringAsker,
		BOOLEAN: Xonomy.getBooleanAsker,
		LONG_STRING:  Xonomy.getLongStringAsker,
		PICK_LIST: Xonomy.getPicklistAsker
	};
	
	//actions used on element menus
	var XONOMY_ELEMENT_ACTION = {		
		NEW_ATTRIBUTE: Xonomy.newAttribute, // actionParameter = {name: "", value: ""}
		NEW_CHILD_ELEMENT: Xonomy.newElementChild, //actionParameter = "<element>...</element>" xml string
		NEW_ELEMENT_BEFORE: Xonomy.newElementBefore,	//actionParameter = "<element>...</element>" xml string	 
		NEW_ELEMENT_AFTER: Xonomy.newElementAfter, //actionParameter = "<element>...</element>" xml string
		DELETE_ELEMENT: Xonomy.deleteElement,
		EDIT_RAW: Xonomy.editRaw,  //edit element as raw text in a popup
		
		//My new element action functions, see mbx-xonomy.js
		EDIT_SIMPLE_CONTENT: Xonomy.editElementSimpleContent,
		COPY_ELEMENT: Xonomy.copyElement,
		PASTE_ELEMENT: Xonomy.pasteElement,
		MOVE_UP: Xonomy.moveElementUp,
		MOVE_DOWN: Xonomy.moveElementDown
	};
	
	
	//actions used on attribute menus
	var XONOMY_ATTRIBUTE_ACTION = {
		DELETE_ATTRIBUTE: Xonomy.deleteAttribute,		
	};
	
	var UTILS = {
	    //removes items with index in the given indexes array from the given array.
		removeItemsFromArray : function(indexes, array) {
		  if(indexes==null || indexes.length==0 || array.length==0)
			return;
 		  for(var i=array.length-1; i>-1; i--) {
		    if(indexes.indexOf(i)!=-1) {
			  array.splice(i, 1);
			}
		  }
		},
		addAllToArray : function(fromArray, toArray) {
			for(var i=0; i<fromArray.length; i++) {
				if(toArray.indexOf(fromArray[i])==-1) {
					toArray.push(fromArray[i]);
				}
			}
		},
		getNodePath : function(jsNode) {				
			var path = jsNode.type=="attribute" ? "@" : "/";
			path += jsNode.name;			
			if(jsNode.parent && jsNode.parent()!=null) {
				path = UTILS.getNodePath(jsNode.parent()) + path;
			}
			return path;
		}		
	};
	
var seed=0;
function getNewID(){
  return "ID_"+(++seed);
}
	
	function MenuItem(caption, tooltip) {
		var self = this;
		self.caption = caption || "?";
		self.action = fnEmpty; // function(htmlID, actionParameter){}
		self.actionParameter = null;
		self.hideIf = fnReturnFalse;  //function(jsElement or jsAttribute){ return true/false whether this menu item should be hidden based on current data }
		
		self.tooltip = tooltip || "";
	}
	
	
	
	/**
	
	AttributeGroup
	
	*/
	function AttributeGroup() {
		var self = this;
		self.id = getNewID();
		self.name = null;
		self.attributeGroups = {};
		self.attributeSpecs = {};
	}
	AttributeGroup.prototype.getAllAttributes=function(){
		var atts = [];
		for(var attName in self.attributeSpecs) {
			atts.push(self.attributeSpecs[attName]);
		}
		for(var grpName in self.attributeGroups) {
			atts = atts.concat(self.attributeGroups[grpName].getAllAttributes());
		}
		return atts;
	};
	
	
	
	/**
	
	Attribute Spec
	
	*/
	function AttributeSpec(config) {
		var self = this;
		self.id = getNewID();
		self.asker = XONOMY_ASKER_FACTORY.STRING;  //fn asking for user input (string, long string, picklist)
		self.menu = [], //array of MenuItem
		self.isReadOnly = fnReturnFalse;
		self.isInvisible = fnReturnFalse;
		self.shy = fnReturnFalse;
		
		self.tooltip = ""; //used as tooltip text, taken from xsd:annotation/xsd:documentation in schema
		self.required = false;
		self.defaultValue = "";
		self.fixedValue = null;
		self.simpleType = new SimpleType.String();
		self.name = null; //optional, useful if AttributeSpec only used for a single named attribute 
		self.validate = function(ctx) {
			self.simpleType.validate(ctx);
		};
		self.getDefaultXML = function(attName) {
			return attName + "=\"" + (self.fixedValue || self.defaultValue || "") + "\" ";
		};
		
		var deleteAttItem = new MenuItem("Delete Attribute", "");
		deleteAttItem.action = XONOMY_ATTRIBUTE_ACTION.DELETE_ATTRIBUTE;
		self.menu.push(deleteAttItem);
		if(typeof config=="object") {
			for(var p in config) {
				if(self.hasOwnProperty(p))
					self[p] = config[p];
			}
		}
	}
	//use this instead of setting simpleType directly to ensure correct asker is also set
	AttributeSpec.prototype.setType = function(simpleType){
		var self = this;
		self.simpleType = simpleType;
		//also set the approriate asker for the simple type used
		self.asker = self.simpleType.getAsker();
		if(self.defaultValue=="") { //use type default if attribute itself doesn't specify one
		  self.defaultValue = self.simpleType.getDefaultValue();
		}
		return self;
	}
	AttributeSpec.prototype.clone = function() {
		var newAttSpec = new AttributeSpec(this);
		return newAttSpec;
	}
		
		
		
	/**
	
	SimpleType
	
	*/	
	var SimpleType = { //string / boolean / number / date / enum
	  Abstract:function(tooltip) { //base type used by the others
	  	 var self = this;
	  	 self.type = "abstract";
	  	 self.tooltip = tooltip || "";
	  	 self.validate = function(ctx){};
	  	 self.getAsker = function(){return null};
	  	 self.getDefaultValue=function(){return ""};
	  	 return self;
	  },
	  String:function(regexPattern, tooltip){
	  	var self = new SimpleType.Abstract(tooltip);
		  self.type = "string";
		  self.id = getNewID();
		  try {
	      self.regex = regexPattern ? (regexPattern instanceof RegExp? regexPattern : new RegExp(regexPattern)) : null;
		  }
		  catch(e) {
		  	console.warn("Skipped invalid regex: "+regexPattern);
		  	self.regex = null;
		  }
		  self.validate = function(ctx){
				if(XSDocSpec.logging) {
					console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" value "+ctx.jsNode.value+ (self.regex!=null?" against regular expression "+self.regex.source : ""));
				}				
				if(self.regex) {
					var firstMatch = self.regex.exec(ctx.jsNode.value);
					if(firstMatch==null || firstMatch.length==0 || firstMatch[0]!=ctx.jsNode.value) { //whole string matches pattern
						ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_REGEX_MISMATCH, text: "Value '"+ctx.jsNode.value+"' doesn't match regular expression: "+self.regex.source});
					}
				}
		};
		self.getAsker = function(){
	  	 	return XONOMY_ASKER_FACTORY.STRING(self.tooltip, self.regex!=null ? self.regex.source : null);
	  	};
	  	return self;
	  },
	  Number:function(min, max, tooltip){
	  	var self = new SimpleType.Abstract(tooltip);
		  self.type = "number";
	  	self.min = typeof min != "undefined" && min!=null ? Number(min) : null;
	  	self.max = typeof max != "undefined" && max!=null ? Number(max) : null;
		  self.validate = function(ctx){
				if(XSDocSpec.logging) {
					console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" value "+ctx.jsNode.value+" is a number"+(self.min?", min:"+self.min:"")+(self.max?", max:"+self.max:""));
				}
				if(ctx.jsNode.value==null || ctx.jsNode.value=='') {				
					ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_MISSING, text: "Value is missing."});
				}
				if(!/^[\-]?[0-9]+([0-9]+)?$/.test(ctx.jsNode.value)) {				
					ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_NOT_A_NUMBER, text: "Value '"+ctx.jsNode.value+"' is not a valid number."});
				}
				if(self.min!=null && Number(ctx.jsNode.value)<self.min) {
					ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_TOO_SMALL, text: "Value '"+ctx.jsNode.value+"' is less than the minimum allowed ("+self.min+")."});
				}
				if(self.max!=null && Number(ctx.jsNode.value)>self.max) {
					ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_TOO_LARGE, text: "Value '"+ctx.jsNode.value+"' is greater than the maximum allowed ("+self.max+")."});
				}
				console.log(ctx.warnings);
				//return typeof ctx.jsNode.value;   why??
			};
		  self.getAsker = function(){
	  	 	return XONOMY_ASKER_FACTORY.STRING(self.tooltip, "number");
	  	};
	  	self.getDefaultValue=function(){return self.min!=null ? String(self.min) : "0"};
	  	return self;	
	  },
	  Date:function(tooltip){ //xsd date formatted string yyyy-MM-dd
	  	var self = new SimpleType.Abstract(tooltip);
		self.type = "date";
		self.validate = function(ctx){
			if(XSDocSpec.logging) {
				console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" value "+ctx.jsNode.value+" is a valid date (yyyy-MM-dd)");
			}
			if(ctx.jsNode.value==null || ctx.jsNode.value=='') {				
				ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_MISSING, text: "Value is missing."});
			}
			var date = new Date(ctx.jsNode.value); //should be xsd format yyyy-MM-dd
			if(date.toString()=="Invalid Date"){
				ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_NOT_A_DATE, text: "Value '"+ctx.jsNode.value+"' isn't a valid ISO date (yyyy-MM-dd)"});
			}
			else { //normalise to yyyy-MM-dd format
				ctx.jsNode.value = String(date.getFullYear()+"-"+(date.getMonth()+1)+"-"+(date.getDate()))
			}
			
		};
		self.getAsker = function(){
	  	 	return XONOMY_ASKER_FACTORY.STRING(self.tooltip, "date");
	  	};
	  	self.getDefaultValue=function(){
	  		var now = new Date();
		    return String(now.getFullYear()+"-"+(now.getMonth()+1)+"-"+(now.getDate())); //use first value in enum as default};
	  	}
	  	return self;
	  },
	  Boolean:function(tooltip){
	  	var self = new SimpleType.Abstract(tooltip);
		self.type = "boolean";
		self.validate = function(ctx){
			if(XSDocSpec.logging) {
				console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" value "+ctx.jsNode.value+" is a valid boolean ('true' or 'false')");
			}
			if(ctx.jsNode.value==null || ctx.jsNode.value=='') {				
				ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_MISSING, text: "Value is missing."});
			}
			if(["true", "TRUE", "false", "FALSE"].indexOf(ctx.jsNode.value)==-1){
				ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_NOT_A_BOOLEAN, text: "Value '"+ctx.jsNode.value+"' isn't a boolean ('true' or 'false')"});
			}
		};
		self.getAsker = function(){
	  	 	return XONOMY_ASKER_FACTORY.BOOLEAN(self.tooltip);
	  	};
	  	self.getDefaultValue=function(){return "false";}
	  	return self;
	  },
	  Enumeration:function(values, baseType, tooltip){
	  	 var self = new SimpleType.Abstract(tooltip);
		 self.type = "enum";
	  	 self.values = (typeof values == "object" && values instanceof Array) ? values : [];
	  	 if(self.values.length==0)
	  	   throw "Enumeration contains no values";
	  	 self.baseType = baseType || new SimpleType.String();
		 self.validate = function(ctx){
		 	if(XSDocSpec.logging) {
				console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" value "+ctx.jsNode.value+" is one of "+self.values.toString());
			}
			if(ctx.jsNode.value==null || ctx.jsNode.value=='') {				
				ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_MISSING, text: "Value is missing."});
			}
		 	var w1 = ctx.warnings.length;
		 	self.baseType.validate(ctx);  //don't bother checking values list if baseType check failed anyway
		 	if(ctx.warnings.length==w1 && values.indexOf(ctx.jsNode.value)==-1) {
				ctx.warnings.push({htmlID: ctx.jsNode.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.VALUE_INVALID, text: "Value '"+ctx.jsNode.value+"' isn't one of the valid options ("+self.values.toString()+")"});
			}
		 };
		 self.getAsker = function(){	  	 	
			var askerParameterArray = [];
			for(var i=0; i<self.values.length; i++) {
			  askerParameterArray.push({
			    value:self.values[i], 
				caption:''
			  });
			}
		 self.getDefaultValue = function(){
		 	return self.values.length>0 ? self.values[0] : "";
		 }
			return XONOMY_ASKER_FACTORY.PICK_LIST(self.tooltip, askerParameterArray);
	  	};	
	  	
	  	if(self.values.length>0) {
		  self.defaultValue = self.values[0]; //use first value in enum as default
		}
	  	return self;	 
	  },
	  isInstance : function(obj) {
	  	if(obj instanceof SimpleType.String
		  	  || obj instanceof SimpleType.Number
		  	  || obj instanceof SimpleType.Boolean
		  	  || obj instanceof SimpleType.Enumeration
		  	  || obj instanceof SimpleType.Date
		  	  || obj instanceof SimpleType.Abstract
	  	  ) {
	  		return true;
	  	}
	  	return false;
	  }
	}
	
	
	
	/**
	
	ElementGroup
	
	new ELEMENT type must have a name.
  any other referencable group just needs a name as well.
  default type is ElementGroup.ELEMENT
	*/	
	function ElementGroup(name, type, minOccurs, maxOccurs){ //for ALL, CHOICE, SEQUENCE, GROUP, GROUP_REF, ELEMENT
		var self = this;
		var config = null;	
		if(typeof name=="object") {
			config = name;
			name = "";
		}		
		self.id = getNewID();
		self.type = type || ElementGroup.TYPE.ELEMENT;  //see ElementGroup.TYPE
		self.groupName = name || ""; //group name or element qualified name for the ELEMENT type (effectively element type reference)		
		self.refName =  null; //name of another element group this group refers to		
		self.minOccurs = typeof minOccurs != "undefined" ? minOccurs : 1;
		self.maxOccurs = typeof maxOccurs != "undefined" ? maxOccurs : 1;
		if(self.maxOccurs=="unbounded") {
			self.maxOccurs = 999999;
		}
		self.childGroups = []; //holds list of elementSpecs or element groups expected
		
		if(config!=null) {
			for(var p in config) {
				if(self.hasOwnProperty(p))
					self[p] = config[p];
			}
			if(config.name) //permitted alias
				self.groupName = config.name;
		}
		if(self.type == ElementGroup.TYPE.GROUP_REF) {
			self.refName = self.groupName;
		}
		
	};
	ElementGroup.prototype.toString = function(){
		return this.type + ":" + this.id + ":" + this.groupName;
	};
	ElementGroup.prototype.addChild = function(childElementGroup){
		var self = this;
		self.childGroups.push(childElementGroup);
	};
	ElementGroup.prototype.getSpecString = function(ctx){
		var self = this;
		var multiplier = self.minOccurs || 1;
		var isOptional = self.minOccurs == 0;
		var str = "";
		if(self.type==ElementGroup.TYPE.GROUP_REF) {
			str = ctx.docSpec.elementGroups[self.refName].getSpecString(ctx);
		}
		else if(self.type==ElementGroup.TYPE.GROUP) {
			str = self.childGroups[0].getSpecString(ctx);
		}
		else if(self.type==ElementGroup.TYPE.SEQUENCE) {
			str = "( ";
			self.childGroups.forEach(function(grp){
				str += grp.getSpecString(ctx) + ",";
			});			
			str = str.substring(0, str.length-1) + ")";
			str = str.replace(/,/g, " then ");
		}
		else if(self.type==ElementGroup.TYPE.CHOICE) {
			str = "( ";
			self.childGroups.forEach(function(grp){
				str += grp.getSpecString(ctx) + ",";
			});			
			str = str.substring(0, str.length-1) + ")";
			str = str.replace(/,/g, " or ");
		}
		else if(self.type==ElementGroup.TYPE.ALL) {
			str = "( ";
			self.childGroups.forEach(function(grp){
				str += grp.getSpecString(ctx) + ",";
			});			
			str = str.substring(0, str.length-1) + ")";
		}
		else if(self.type==ElementGroup.TYPE.ELEMENT) {
			str = "<"+self.groupName+">";
		}
		
		var retStr = "";
		for(var i=0; i<multiplier; i++) {
			retStr += str + ", ";
		}
		retStr = retStr.substring(0, retStr.length-2);
		if(isOptional) {
			retStr = retStr + "?";
		}
		return retStr;		
	};
	//returns all element names possible in the element group tree 
	ElementGroup.prototype.getChildElementNames = function(docSpec){
		var self = this;
		var names = [];
		for(var i=0; self.childGroups!=null && i<self.childGroups.length; i++) {
			var childGroup = self.childGroups[i];
			if(!childGroup) {
				console.warn("NULL childGroup found on "+self.type +" element with name: "+self.groupName);
				continue;
			}
			if(childGroup.type==ElementGroup.TYPE.GROUP_REF) {
				childGroup = docSpec.elementGroups[childGroup.refName];
			}
			if(!childGroup) {
				throw "Element group with name '"+childGroup.refName+"' not found.";
			}
			if(childGroup.type==ElementGroup.TYPE.ELEMENT) {
				names.push(childGroup.groupName);
			}
			else if(self==childGroup) {
				console.warn("Element group refers to itself as a child group (i.e. infinite loop)");
			}
			else {
				UTILS.addAllToArray(childGroup.getChildElementNames(), names);
			}
		}
		return names;
	};
	
	ElementGroup.prototype.validate = function(ctx, fromIndex) {
			var self = this;	
			var valid = null;  // ValidationResponse object		
			var element = ctx.jsNode;
			var xsElementName = ctx.docSpec.getSchemaBasedElementName(element.name);
			
			if(self.type==ElementGroup.TYPE.GROUP_REF) {
				if(!self.refName) {
					throw "Invalid docspec, group reference is missing the name of the group to use.";
				}
				var referredGroup = ctx.docSpec.elementGroups[self.refName];
				if(referredGroup) { //a group reference doesn't have a name, it's particular to the group its used in
					if(XSDocSpec.logging) {
						console.log("Found group ref '"+self.refName+"', it refers to a "+self.type+" group with "+self.childGroups.length+" child groups.");
					}
					self.type = ElementGroup.TYPE.GROUP;
					self.childGroups = referredGroup.childGroups;
				}
				else {
					throw "Invalid docspec, '"+self.refName+"' group not found.";
				}
			}
			
			if(!ctx.childElements) {
				ctx.childElements = []; //clone the list of child elements so we can remove from it to record what's been validated.
				for(var i=0; i<element.children.length; i++) {
					ctx.childElements.push(element.children[i]);
				}
			}
			if(typeof fromIndex=="undefined") //index if first element in the childElements list to start validating from
				var fromIndex = 0;
				
			var typeString = "";
			if(self.type==ElementGroup.TYPE.ELEMENT) {
				typeString = " <"+self.groupName + "> element";
				valid = self.validateElement(ctx, fromIndex, false);
			}
			else if(self.type==ElementGroup.TYPE.ALL) {
				typeString = " 'all' group";
				valid = self.validateAll(ctx, fromIndex);
			}
			else if(self.type==ElementGroup.TYPE.SEQUENCE) {
				typeString = " 'sequence' group";
				valid = self.validateSequence(ctx, fromIndex);
			}
			else if(self.type==ElementGroup.TYPE.CHOICE) {
				typeString = " 'choice' group";
				valid = self.validateChoice(ctx, fromIndex);
			}
			else if(self.type==ElementGroup.TYPE.GROUP) { //a group must have a single all, choice or sequence in it
				var typeString = " group";
				valid = self.childGroups[0].validate(ctx, fromIndex);
			}
			
			if(valid && valid.groups < self.minOccurs && valid.groups==0) {
				if(XSDocSpec.logging) {
					console.log("INVALID: expected at least "+self.minOccurs+typeString+" but found ZERO");
				}
				valid = null;
			}
			else if(valid && valid.groups < self.minOccurs) {
				if(XSDocSpec.logging) {
					console.log("INVALID: expected at least "+self.minOccurs+typeString+" but found "+valid.groups);
				}
				valid = null;
			}
			if(valid && valid.groups > self.maxOccurs) {
				if(XSDocSpec.logging) {
					console.log("INVALID: expected up to  "+self.maxOccurs+typeString+" but found "+valid.groups);
				}
				valid = null;
			}			
			return valid;
	};
	//all elements are looked at, from Index is ignored
	ElementGroup.prototype.validateElement = function(ctx, fromIndex, allGroup) {
	    var self = this;
	    if(XSDocSpec.logging) {
			console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" has "+self.minOccurs+" to "+self.maxOccurs+" "+self.groupName+" child elements");
		}
	    var valid = new ValidationResponse();
		for(var i=fromIndex; i<ctx.childElements.length; i++) { //look at remaining unvalidated elements in ctx.childElements
			var childNode = ctx.childElements[i];
			if(childNode.type=='text')
				continue;
			var xsElementName = ctx.docSpec.getSchemaBasedElementName(childNode.name);
			if(xsElementName==self.groupName) { //found this element in ctx.childElements
				if(!allGroup || valid.indexes.length==0) {
					valid.indexes.push(i); //record index of found element
					valid.nextIndex = i+1; //update index of next element to start validating from						
				}
			}
			else if(!allGroup)
				break; //started finding other elements with different name
			if(valid.indexes.length==self.maxOccurs)
				break; //found max allowed of this group, any further elements should below to a different group.
		}
		if(valid)
			valid.groups = valid.indexes.length;
		return valid; //return matched number of elements and their indexes in {groups:0, indexes:[]} object
	}
	ElementGroup.prototype.validateSequence = function(ctx, fromIndex) {
		var self = this;
		if(XSDocSpec.logging) {
			console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" has a sequence of child groups "+self.maxOccurs+" to "+self.minOccurs+" times");
		}
		var valid = new ValidationResponse();
		valid.nextIndex = fromIndex;
		var matchedSequence = true;
		var limit = WHILE_LOOP_LIMIT;
		while(matchedSequence) {
			for(var i=0; self.childGroups!=null && i<self.childGroups.length; i++) { //for each child group get a match
				var childGroupValid = self.childGroups[i].validate(ctx, valid.nextIndex);
				if(childGroupValid==null) {
					matchedSequence = false;					
					break;
				}
				else { //update validation response object
					valid.nextIndex = childGroupValid.nextIndex;
					UTILS.addAllToArray(childGroupValid.indexes, valid.indexes);
				}
			}
			if(matchedSequence) {
				valid.groups++; //start again, count how many times the whole sequence is matched, return that found number
				if(valid.groups==self.maxOccurs)
					break; //found max allowed of this group, any further elements should below to a different group.
			}
			if(valid.nextIndex == ctx.childElements.length)
				break; //no more elements to validate
			limit--;
			if(limit==0) {
				throw "while loop iteration limit reached validating sequence (ctx.jsNode.name='"+ctx.jsNode.name+"', child element nextIndex="+valid.nextIndex+")";
			}
		}
		return valid;
	}
	ElementGroup.prototype.validateChoice = function(ctx, fromIndex) {
		var self = this;
		if(XSDocSpec.logging) {
			console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" has a choice of child elements/groups ("+self.maxOccurs+" to "+self.minOccurs+" times)");
		}
		var valid = new ValidationResponse();
		valid.nextIndex = fromIndex;
		var matchedChoice = true;
		var limit = WHILE_LOOP_LIMIT;
		while(matchedChoice) {
			matchedChoice = false;
			for(var i=0; self.childGroups!=null && i<self.childGroups.length; i++) { //for each child group get a match
				var childGroupValid = self.childGroups[i].validate(ctx, valid.nextIndex);
				if(childGroupValid) {
					matchedChoice = true;
					valid.nextIndex = childGroupValid.nextIndex;
					UTILS.addAllToArray(childGroupValid.indexes, valid.indexes);
					break;
				}
			}
			if(matchedChoice) {
				valid.groups++; //start again, count how many times the whole sequence is matched, return that found number
				if(valid.groups==self.maxOccurs)
					break; //found max allowed of this group, any further elements should below to a different group.
			}
			if(valid.nextIndex == ctx.childElements.length)
				break; //no more child elements to validate
			limit--;
			if(limit==0) {
				throw "while loop iteration limit reached validating choice group";
			}
		}
		return valid;
	}
	ElementGroup.prototype.validateAll = function(ctx, fromIndex) { //only elementSpecs allowed in one of these, not groups
		var self = this;
		if(XSDocSpec.logging) {
			console.log("Validating "+UTILS.getNodePath(ctx.jsNode)+" has all expected child elements ("+self.maxOccurs+" to "+self.minOccurs+" times)");
		}
		var valid = new ValidationResponse(); //represents result from validating a number of ALL groups
		valid.nextIndex = fromIndex;
		var matchedAllGroup = true;
		var ranOnce = false;
		var limit = WHILE_LOOP_LIMIT;
		while(matchedAllGroup) {
			var validGroup = new ValidationResponse(); //represents result from validating a single ALL groups
			for(var i=0; self.childGroups!=null && i<self.childGroups.length; i++) { //for each child element rule see if its found
				var elementRule = self.childGroups[i];
				if(elementRule.type!=ElementGroup.TYPE.ELEMENT) {
					//warning: skipped non-element type group found in ALL group.
					continue;
				}
				var elementRuleValid = elementRule.validateElement(ctx, valid.nextIndex, true); //is this element found anywhere in ctx.childElements
				UTILS.addAllToArray(elementRuleValid.indexes, validGroup.indexes);
			}		
			
			if(validGroup.indexes.length>0) { //we found some elements
				//check this group of found elements start at fromIndex and don't have any gaps
				validGroup.indexes.sort(); //index numbers into numeric order
				
				var indexOfLastElementFound = validGroup.indexes[validGroup.indexes.length-1]
				var invalidElementsAt = [];	
				var unexpectedElement = null;			
				for(var indexNum=valid.nextIndex; indexNum<indexOfLastElementFound; indexNum++) {
					if(validGroup.indexes.indexOf(indexNum)==-1) {						
						unexpectedElement = ctx.childElements[indexNum];
						var xsElementName = ctx.docSpec.getSchemaBasedElementName(ctx.jsNode.name);
						ctx.warnings.push({htmlID: unexpectedElement.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.UNEXPECTED_CHILD_ELEMENT, text: "Element '"+xsElementName+"' contains unexpected '"+unexpectedElement.name+"' child element."});
					}
				}
				if(unexpectedElement) {
					matchedAllGroup = false;
				}
				else {
					UTILS.addAllToArray(validGroup.indexes, valid.indexes);
					valid.nextIndex = indexOfLastElementFound + 1;
					valid.groups++;
					if(valid.groups==1)
						break; //found max allowed of this group, any further elements should below to a different group.
				}
			}
			else if(ranOnce) { //we found no elements at all, and this is at least the second time we ran this loop
				matchedAllGroup = false;
			}			
			ranOnce = true;
			if(valid.nextIndex == ctx.childElements.length)
			   break;
			limit--;
			if(limit == 0) {
				throw "while loop iteration limit reached validating ALL group";
			}
		}
		return valid;
	}
	ElementGroup.TYPE = {
		ELEMENT: "element", //i.e. a single element type occuring 0 or more times
		ALL: "all", //all child elements optional in any order, each no more than once.
		SEQUENCE: "sequence",
		CHOICE: "choice",
		GROUP: "group",
		GROUP_REF: "group-ref"		
	}
	
	
	
	/**
	
	ElementSpec
	
	like a schema complex type definition
	*/
	function ElementSpec(config) {
		var self = this;		
		self.attributeSpecs = {};  //name : AttributeSpec
		self.attributes = self.attributeSpecs; //as used by Xonomy itself
		self.menu = []; //array of MenuItem JUST USE THIS I THINK
		self.inlineMenu = [];  //array of MenuItem JUST USE THIS I THINK
		self.canDropTo = [];  //array of qualified element names this one can be dropped into
		self.mustBeAfter = [];  //array of qualified element names that must exist as previous siblings under parent element
		self.mustBeBefore = [];  //as above but must be before the listed siblings
		self.oneliner = function(){
			return self.elementGroup==null ? true : false;
		};
		self.hasText = fnReturnFalse;
		self.collapsible = fnReturnTrue; //always surely
		self.collapsed = fnReturnFalse; //why?
		self.localDropOnly = fnReturnFalse; //make always true?
		self.isReadOnly = fnReturnFalse; //naaahh
		self.isInvisible = fnReturnFalse; //naaahh
		self.asker = XONOMY_ASKER_FACTORY.LONG_STRING();
		self.askerParameter = null;
		
		//my extensions
		self.id = getNewID();
		self.attributeGroups = {};
		self.tooltip = "";  //tooltip help text
		self.allowMixed = false; //not sure xonomy handles adding text/element nodes as children together???
		self.getDefault = function(){return ""};
		self.elementGroup = null; // new ElementGroup();
		self.simpleType = new SimpleType.String();
		//self.canBeRoot = false;  //use this??
		if(typeof config=="object") {
			for(var p in config) {
				if(self.hasOwnProperty(p))
					self[p] = config[p];
			}
			if(config.attributeSpecs) {
			  self.attributeSpecs = config.attributeSpecs;
				self.attributes=self.attributeSpecs;
			}
		}
	};
	ElementSpec.prototype.clone = function() {
		var self = this;
		var newElSpec = new ElementSpec();
		for(var attName in self.attributeSpecs) {
			newElSpec.attributeSpecs[attName] = self.attributeSpecs[attName].clone();
		}
		newElSpec.tooltip = self.tooltip;
		newElSpec.simpleType = self.simpleType !=null ? self.simpleType : null;
		newElSpec.elementGroup = self.elementGroup!=null ? self.elementGroup.clone() : null;
		return newElSpec;
	};
	ElementSpec.prototype.setElementGroup = function(elementGroup, docSpec){
		var self = this;
		self.elementGroup = elementGroup;		
	};
	ElementSpec.prototype.createActionsMenu = function(docSpec) { //call this after you've added everything also needed to the element spec
		var self = this;
		if(self.menu.length>0) 
			return; //already been done
			
		//add 'Edit value' menu option, launching appropriate Asker
		if(self.elementGroup==null) {
			self.asker = this.simpleType.getAsker();
			var menuItem = new MenuItem("Edit value");
			menuItem.action = XONOMY_ELEMENT_ACTION.EDIT_SIMPLE_CONTENT;
			menuItem.actionParameter = {asker: self.asker};
			self.menu.push(menuItem);
		}
			
		//delete element menu option
		var deleteElementItem = new MenuItem("Delete element");
		deleteElementItem.action = XONOMY_ELEMENT_ACTION.DELETE_ELEMENT;
		self.menu.push(deleteElementItem); 	
		
		//copy element
		var copyItem = new MenuItem("Copy");
		copyItem.action = XONOMY_ELEMENT_ACTION.COPY_ELEMENT;
		self.menu.push(copyItem);
		
		//paste before
		var pasteItem1 = new MenuItem("Paste before");
		pasteItem1.action = XONOMY_ELEMENT_ACTION.PASTE_ELEMENT;
		pasteItem1.actionParameter = PASTE_MODE.BEFORE_ELEMENT;
		self.menu.push(pasteItem1);
		
		//paste child
		var pasteItem2 = new MenuItem("Paste child");
		pasteItem2.action = XONOMY_ELEMENT_ACTION.PASTE_ELEMENT;
		pasteItem2.actionParameter = PASTE_MODE.CHILD_ELEMENT;
		self.menu.push(pasteItem2);
		
		//paste after
		var pasteItem3 = new MenuItem("Paste after");
		pasteItem3.action = XONOMY_ELEMENT_ACTION.PASTE_ELEMENT;
		pasteItem3.actionParameter = PASTE_MODE.AFTER_ELEMENT;
		self.menu.push(pasteItem3);
		
		//move up
		var moveUpItem = new MenuItem("Move up");
		moveUpItem.action = XONOMY_ELEMENT_ACTION.MOVE_UP;
		self.menu.push(moveUpItem);
		
		//move down
		var moveDownItem = new MenuItem("Move down");
		moveDownItem.action = XONOMY_ELEMENT_ACTION.MOVE_DOWN;
		self.menu.push(moveDownItem);
			
		//Add menu items for each 'add <name> attribute' required
		for(var attName in self.attributeSpecs) {
			var attSpec = self.attributeSpecs[attName];
			var addAttributeItem = new MenuItem("Add '"+attName+"' attribute", attSpec.tooltip);
			addAttributeItem.action = XONOMY_ELEMENT_ACTION.NEW_ATTRIBUTE;
			addAttributeItem.actionParameter = {name: attName, value: (attSpec.fixedValue || attSpec.defaultValue || "")};
			addAttributeItem.hideIf = function(jsElement){ return jsElement.hasAttribute(attName); }
			self.menu.push(addAttributeItem); 			
		}
		
		//Add menu items for each 'add <child> element' required
		var childElementNames = self.elementGroup!=null ? self.elementGroup.getChildElementNames(docSpec) : [];
		for(var i=0; i<childElementNames.length; i++) {
			var childElementSpec = docSpec.elementSpecs[childElementNames[i]]; 
			if(childElementSpec) {
				var addElementItem = new MenuItem("Add '"+childElementNames[i]+"' element", childElementSpec.tooltip);
				addElementItem.action = XONOMY_ELEMENT_ACTION.NEW_CHILD_ELEMENT;
				addElementItem.actionParameter = childElementSpec.getDefaultXML(childElementNames[i]);
				self.menu.push(addElementItem);
			}
			else {
				throw "No element spec found for '"+childElementNames[i]+"'";
			}
		}
		
		var editElementItem = new MenuItem("Edit raw XML");
		editElementItem.action = XONOMY_ELEMENT_ACTION.EDIT_RAW;
		editElementItem.actionParameter = {};
		self.menu.push(editElementItem);		
		
	};
	ElementSpec.prototype.getDefaultXML = function(elementName){
		var self = this;
		var xml = "<"+elementName+" ";
		for(var attName in self.attributeSpecs) {
			 if(self.attributeSpecs[attName].required || self.attributeSpecs[attName].fixed) {
			   xml+=self.attributeSpecs[attName].getDefaultXML(attName);
			 }
		}
		xml += ">";		
		if(self.elementGroup==null) {
			xml += self.simpleType.getDefaultValue(); //use default text value for the type
		}
		xml += "</"+elementName+">";
		
		return xml;
	};
	ElementSpec.prototype.validate = function(ctx){
		var self = this;
		var element = ctx.jsNode;
		var attNames = [];
		var attSpec = null;
		if(XSDocSpec.logging && element.attributes.length>0) {
			console.log("Validating "+element.attributes.length+" attributes found on element "+UTILS.getNodePath(ctx.jsNode));
		}
		//validate attributes found are expected and content is valid
		for(var i=0; i<element.attributes.length; i++) {
			var att = element.attributes[i];			
			attSpec = self.attributeSpecs[att.name];
			if(attSpec) {
				attNames.push(att.name);
				ctx.jsNode = att;
				attSpec.validate(ctx);
			}
			else {
				ctx.warnings.push({htmlID: element.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.UNEXPECTED_ATTRIBUTE, text: "Element contains unexpected '"+att.name+"' attribute."});
			}			
		}
		//check all required attributes are present
		for(var attName in self.attributeSpecs){
			attSpec = self.attributeSpecs[attName];
			if(XSDocSpec.logging && attSpec.required) {
				console.log("Validating whether "+UTILS.getNodePath(ctx.jsNode)+" has required attribute '"+attName+"'");
			}
			if(attSpec.required && attNames.indexOf(attName)==-1) {
				ctx.warnings.push({htmlID: element.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.MISSING_REQUIRED_ATTRIBUTE, text: "Element missing required '"+attName+"' attribute."});
			}
		}
		ctx.jsNode = element;
		var childElements = element.getChildElements();
		if(self.elementGroup) {
			//validate the names of child elements found are as expected
			var valid = self.elementGroup.validate(ctx);
			if(valid) {
				if(XSDocSpec.logging) {
					console.log("Validating that "+UTILS.getNodePath(ctx.jsNode)+" has no unexpected child elements");
				}
				for(var i=valid.nextIndex; i<childElements.length; i++) { //the group validation is happy, but there may be extra unexpected elements..
					ctx.warnings.push({htmlID: element.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.UNEXPECTED_CHILD_ELEMENT, text: "Unexpected child <"+childElements[i].name+"> element found"});
				}
			} else {
				ctx.warnings.push({htmlID: element.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.INVALID_CHILD_ELEMENTS, text: "Element has invalid content, expected: "+self.elementGroup.getSpecString(ctx)});
			}			
		}
		else if(self.simpleType) {
			if(XSDocSpec.logging) {
        console.log("Validating that "+UTILS.getNodePath(ctx.jsNode)+" text content is a valid "+self.simpleType.type);
      }
			var tmp = ctx.jsNode.value;
			ctx.jsNode.value = "";
			//validate 1st child text node
			if(ctx.jsNode.children.length>0 && ctx.jsNode.children[0].type=="text") {
				ctx.jsNode.value = ctx.jsNode.children[0].value;
			}
			self.simpleType.validate(ctx);
			ctx.jsNode.value = tmp;
		}
		
		//now validate any child elements whether they're expected where they are or not
		for(var i=0; i<childElements.length; i++) {
			if(childElements[i].type=='text' || typeof childElements[i].name == 'undefined')
				continue;
			var elementSpec = ctx.docSpec.elementSpecs[childElements[i].name];
			if(elementSpec)
				elementSpec.validate(new ValidationContext(childElements[i], ctx.warnings, ctx.docSpec));
			else
				throw "Missing spec for element with name "+childElements[i].name;
		}
	};
	
	 //available at every stage of validation tree
  function ValidationContext(jsRootElement, warnings, docSpec) {
    var self = this;
    self.jsNode = jsRootElement; //current js object being validated
    self.warnings = warnings;
    self.docSpec = docSpec;
  }
  
  //encapsulated the info returned by one of the validate functions
  function ValidationResponse() {
    this.groups = 0;
    this.indexes = [];
    this.nextIndex = 0;
  }
  
  
  
  /**
  
  XSDocSpec
  
	*/
	function XSDocSpec() {
		var self = this;	
		self.warnings = [];					
		self.elementSpecs = {}; // element name or complex/simple type name : Element object
		self.elements = self.elementSpecs //as Xonomy refers to it
		self.elementGroups = {}; //group name : ElementGroup object
		self.simpleTypes = {}; //name : SimpleType instance object		
		self.namespaces = {}; //eg. "xmlns:ma"="myawesomenamepsace" from parsing of xml schema file (prefixes can be different to those used in xml instance doc)
		self.imports = {}; //seperate docspecs by namespace uri e.g. "myawesomenamespace"=XSDcSpec instance
		self.onchange = function(jsNode){ //hit with individual jsElement/Attribute that's been changed, to avoid validating whole doc
			var self = this;
			if(!jsNode)
				return;
			var warningCount = Xonomy.warnings.length;
			if(jsNode.type=="text") {
				jsNode = jsNode.parent();	//get parent element			
			}
			if(XSDocSpec.logging) {
				console.log("Re-validating "+UTILS.getNodePath(jsNode)+" as it was changed");
			}
			if(jsNode.type=="attribute" 
			  && self.elementSpecs[jsNode.parent().name]!=null
			  && self.elementSpecs[jsNode.parent().name].attributeSpecs[jsNode.name]!=null) {
				var ctx = new ValidationContext(jsNode, self.warnings, self);	
				self.elementSpecs[jsNode.parent().name].attributeSpecs[jsNode.name].validate(ctx);
			}
			if(jsNode.type=="element" && self.elementSpecs[jsNode.name]!=null) {
				var ctx = new ValidationContext(jsNode, self.warnings, self);
				self.elementSpecs[jsNode.name].validate(ctx);				
			}
			var htmlEl = document.getElementById(jsNode.htmlID);
			htmlEl.classList.remove("invalid");
			if(self.warnings.length>warningCount)
				htmlEl.classList.add("invalid");
			
		};
		self.validate = function(jsRootElement){
			if(typeof jsRootElement == "string") {
				jsRootElement = Xonomy.xml2js(jsRootElement);
			}
			var self = this;
			self.warnings = []; //clear warnings from previous run
			var ctx = new ValidationContext(jsRootElement, self.warnings, self);
			if(XSDocSpec.logging) {
				console.log("Docspec validating root element "+UTILS.getNodePath(ctx.jsNode));
			}
			var xsElementName = self.getSchemaBasedElementName(jsRootElement.name);
			if(self.elementSpecs[xsElementName] && self.elementSpecs[xsElementName].validate)
				self.elementSpecs[xsElementName].validate(ctx);
			else {
				var invalidElementSpec = self.elementSpecs[xsElementName];
				ctx.warnings.push({htmlID: jsRootElement.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.UNEXPECTED_ROOT_ELEMENT, text: "Unexpected root element <"+jsRootElement.name+"> found"});
			}			
			if(XSDocSpec.logging) {
				console.log("Validation complete, XML found to be "+(ctx.warnings.length>0?"invalid":"valid"));
			}
			Xonomy.warnings = self.warnings; //for Xonomy ui to show warnings in editor
			return ctx.warnings;
		}; //hit with root jsElement to validate the whole doc
		
		self.defaultElementSpec = new ElementSpec();
		self.defaultElementSpec.createActionsMenu(self);
		self.defaultElementSpec.validate = function(ctx){
			var element = ctx.jsNode;
			ctx.warnings.push({htmlID: element.htmlID, path:UTILS.getNodePath(ctx.jsNode), warningId:ERROR.UNEXPECTED_ELEMENT, text: "Unexpected  <"+element.name+"> element found"});
		};
	}	
	//find the element name using prefix the schema uses, rather than one the xml doc uses (which may be different)
	XSDocSpec.prototype.getSchemaBasedElementName = function(eName){
		var self = this;
		var colonPos = eName.indexOf(":");
		var nsPrefix = colonPos>-1 ? eName.substring(0, colonPos) : "";
		var eSimpleName = colonPos>-1 ? eName.substring(colonPos+1) : eName;
		var ns = (nsPrefix=="" ? Xonomy.namespaces["xmlns"] : Xonomy.namespaces["xmlns:"+nsPrefix]) || "";
		var newNSPrefix = null; //the ns attribute used by the xml schema for 'ns' namespace
		for(var nsAtt in self.namespaces) { //look through the xml schema namespaces to find a match
			if(self.namespaces[nsAtt]==ns) {
			  newNSPrefix = nsAtt=="xmlns" ? "" : nsAtt.substring(nsAtt.indexOf(':')+1) + ':';
			  break;
			}
		}
		if(newNSPrefix == null) {
			throw "Namespace not found in schema/docSpec for element "+eName+" with namespace: '"+ns+"'";
		}
		return newNSPrefix + eSimpleName;
	};
	XSDocSpec.prototype.createActionMenus = function(){
		var self = this;
		for(var elName in self.elementSpecs) {
			var elSpec = self.elementSpecs[elName];
			elSpec.createActionsMenu(self);
		}
	};
	//sets what element names each element spec can be dragged into based on element groups configured on them
	XSDocSpec.prototype.setDropTargetElements = function(){
		var self = this;
		for(var elName in self.elementSpecs) {
			var elSpec = self.elementSpecs[elName];
			if(elSpec.elementGroup!=null) {
				var childEls = elSpec.elementGroup.getChildElementNames(self);
				for(var i=0; i<childEls.length; i++) {
					var childElName = childEls[i];
					if(self.elementSpecs[childElName]) {
						var childElSpec = self.elementSpecs[childElName];
						childElSpec.canDropTo.push(elName); //tell child element spec it can be dropped into parent element name
					}
				}
			}
		}
	};
	
	//run after populating the docspec, to also add attributes in attribute groups to relevant element specs.
	XSDocSpec.prototype.expandAttributeGroups=function(){
		var self = this;
    for(var elName in self.elementSpecs) {
      var elSpec = self.elementSpecs[elName];
      for(var attGrpName in self.attributeGroups) {
        var attGrp = self.attributeGroups[attGrpName];
        var atts = attGrp.getAllAttributes();
        for(var i=0; i<atts.length; i++) {
          var att = atts[i];
          if(!elSpec.attributes.hasOwnProperty(att.name))
            elSpec.attributes[att.name] = att;
        }
      }
    }
	},
	
	//finalises the docspec object by running through configures element specs
	//and populating action menus and 'can drag and drop to' elements
	XSDocSpec.prototype.build = function(){
		var self=this;
		self.expandAttributeGroups();
		self.createActionMenus();
		self.setDropTargetElements();
	};
	XSDocSpec.SimpleType = SimpleType;
	XSDocSpec.AttributeSpec = AttributeSpec;
	XSDocSpec.ElementSpec = ElementSpec;
	XSDocSpec.ElementGroup = ElementGroup;
	XSDocSpec.AttributeGroup = AttributeGroup;
	XSDocSpec.logging = false;
	XSDocSpec.ERROR = ERROR;
	
	return XSDocSpec;
})();
/*!
 * JSOCS JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(){

var seperator = '_';
var ruleOptions = {}; //is populated with suffix/name : RuleOption
var ROOT_PROPERTY_NAME = "root";
var JSOCS_PREFIX = "jsocs";


//compiles given jsocs object producing a PropertyRuleSet object which can be used to validate a value.
function compile(jsocs) {
	return compileJSOCSProperty(jsocs);
}

//compiles given jsocs object producing a PropertyRuleSet object which is then used to validate the given value.
function validate(value, jsocs) {
	return compileJSOCSProperty(jsocs).validate(value);
}

//object containing everything a validate function might need
function ValidationContext(value) {
	this.value = value; //the value of a property to validate
	this.errors = []; //holds list of string error messages if validation fails somewhere
	this.currentPath = ""; // current.object.path[2].the.value.being.validated
	this.ruleValue = null; //value from the current validation rule if applicable 
}


//represents the rules associated with an object property
function PropertyRuleSet(name, id){
  this.name = name; //all properties must have a name, even if it's 'jsocs' and doesn't refer to an actual property
  this.id = id || null; //TODO - ensure it always start with '_'
  this.description = ""; //describe what this set of rules is meant for  
  this.reference=null; //default is no refid or id for another to refer to
  this.inclusion=null; //default is optional
  this.arrayType=null; //default is single (not array)
  this.dataType=null; //default is any
  this.restrictions=[]; //default to no further restrictions
  this.errors = []; //list of validation error messages from the last validate operation that ran
}
PropertyRuleSet.prototype.appendRule = function(ctx, ruleName, ruleValue) {
		var self = this;
	  	  var ruleOpt = ruleOptions[ruleName];		  	  
		  if(ruleOpt) { //if ruleName is a valid rule type name
		  
		  	//build rule object
		  	if(ruleOpt===RuleOption.OBJECT) {
		      ruleValue = compileJSOCSObject(ruleValue, ctx);
		  	}
		    var rule = new Rule(ruleOpt, ruleValue);		       
		    
		    //if rule refers to another ruleset by id, merge those rules into this one.
		    if(ruleOpt===RuleOption.IDREF) {
		      if(typeof ruleValue == 'string'){
		        var rs = ctx.getById(ruleValue);
		        if(!rs){
		          console.log(ctx);
		          throw "Rules not found for idref: "+ruleValue;		          
		        }
		        self.mergeIn(rs);
		      }
		    }
		    
		   console.log("Appending new "+ruleOpt.name+" rule"+(ctx.ns?" to context with namespace: "+ctx.ns:""));
		    
		  //add the rule to this ruleset in the appropriate place
	      if(rule.ruleOption.ruleType==RuleType.INCLUSION && self.inclusion==null)
			self.inclusion=rule;
		  if(rule.ruleOption.ruleType==RuleType.REFERENCE && self.reference==null)
			self.reference=rule;
		  if(rule.ruleOption.ruleType==RuleType.ARRAY_TYPE && self.arrayType==null)
			self.arrayType=rule;
		  if(rule.ruleOption.ruleType==RuleType.DATA_TYPE && self.dataType==null)
			self.dataType=rule;
		  if(rule.ruleOption.ruleType==RuleType.RESTRICTION)
			self.restrictions.push(rule);		
		  //set the id of the rule set if ID rule option is used
		  if(rule.ruleOption == RuleOption.ID && typeof rule.ruleValue=="string") {
		  	self.id = rule.ruleValue;
		  }
		    
		    //register this ruleset in ctx.type_[id] object unless its a duplicate id
		    if(ruleOpt===RuleOption.ID && self.id) {
				if(ctx.type_[self.id]) {
				  throw "JSOCS type with id:"+self.id+" is declared more than once" + ctx.ns?" on namespace "+ctx.ns:"";
				}
				ctx.type_[self.id] = self;
			}
			
		    return true; //rule added
		  }
		  else { //ruleName not known
		  	console.warn("PropertyRuleSet.appendRule('"+ruleName+"', ruleValue) failed, ruleName is invalid.");
		  }
		  return false; //rule not added as ruleName is invalid
	}


//add in given rules to this ruleset
//used when you have several object properties specifying
//different rules for the same target property nane
PropertyRuleSet.prototype.mergeIn = function(ruleSet){
	this.copyRules(ruleSet, this);
};
PropertyRuleSet.prototype.copyRulesTo = function(ruleSet){
	this.copyRules(this, ruleSet);
};
PropertyRuleSet.prototype.copyRules = function(from, to) {
	//copy rules from this rule set to the given one. (used for refid inheritance)
	var copyablePropNames = ['reference', 'inclusion', 'arrayType', 'dataType', 'restrictions'];	
	for(var p in from) {
		if(copyablePropNames.indexOf(p)==-1)
			continue;
		if(p=="restrictions") {
			if(from[p]!=null && from[p].length>0)
				to[p].concat(from[p]);
		}
		else if(from[p]!=null) {
		  if(to[p]==null)
			to[p] = from[p];
		  else
		    console.warn("Already set "+p+" rule.");
		}
	}
}

//Use ruleset date to validate the given value
PropertyRuleSet.prototype.validate = function(valueOrVCTX){  
  var vCtx = valueOrVCTX;
  var rootValidationCall = false;
  if(!(vCtx instanceof ValidationContext)) {
  	vCtx = new ValidationContext(vCtx); //wrap value in ValidationContext if not already
  	rootValidationCall = true;  	
  }
       
  var startErrors = vCtx.errors.length;
       
  if(this.arrayType!=null && this.arrayType.validate(vCtx)) {
  	  //new references here as vCtx.value and vCtx.currentPath are be overwritten for each element
  	  var array = vCtx.value;
  	  var currentPath = vCtx.currentPath;
  	  for(var i=0; i<array.length; i++) {
  	  	//alter value and path on the vCtx so it's correct for each array element
  	  	vCtx.value = array[i];
  	  	vCtx.currentPath = currentPath + "["+i+"]";
  	  	
  	  	//validate data type and restrictions for each array element
  	    if(this.dataType!=null) {
			this.dataType.validate(vCtx);
		}	  
		for(var j=0; j<this.restrictions.length; j++) {
			this.restrictions[j].validate(vCtx);
		}
  	  }  	    
  }
  else { //validate data type and restrictions
  	if(this.dataType!=null) {
		this.dataType.validate(vCtx);
	}	  
	for(var i=0; i<this.restrictions.length; i++) {
		this.restrictions[i].validate(vCtx);
	}
  }
  
  var endErrors = vCtx.errors.length;
  var isValid = true;
  if(endErrors>startErrors) { //some of the checks failed validation
  	isValid = false;
  }

  if(rootValidationCall)
  	this.errors = vCtx.errors; //will be empty array if all validation passed
  
  return isValid;  
}; 



//deep recursive equality check.
//optional arguments...
//3rd argument is array to populate with inequalities discovered if found.
function equal(expected, actual, _errors, _path) {	
	var errors = _errors || [];
	var initialErrors = errors.length;
	var path = _path || ["root"];
	if(typeof path == 'string')
	   path = [path];
	function getPathString(path) {
		var pathString = "";
		for(var i=0; i<path.length; i++) {
			pathString += path[i];
		}
		return pathString;
	}
	
	if(typeof expected != typeof actual) {
		errors.push("Actual type '"+typeof actual+"' doesn't match expected type '"+typeof expected+"' at "+getPathString(path));
	}	
	if(expected instanceof Array) {
		if(expected.length!=actual.length)
			errors.push("Actual array has length: "+actual.length+" but expected length is: "+expected.length+" at "+getPathString(path));
		else {
			for(var i=0; i<expected.length; i++) {
				path.push("["+i+"]");
				equal(expected[i], actual[i], errors, path);
				path.pop();
			}
		}
	}
	else if(typeof expected=='object') {
		for(var p in expected) {
			path.push("."+p);
			if(actual.hasOwnProperty(p))
				equal(expected[p], actual[p], errors, path);
			else {
			 	errors.push("Object is missing expected property '"+p+"' at "+getPathString(path));
			}
			path.pop();
		}
	}
	else if(expected!==actual) {
		errors.push("Actual value ("+actual+") doesn't match expected value ("+expected+") at "+getPathString(path));
	}
	return !errors.length>initialErrors;
}


//class representing compiled jsocs for a given ns 
//for validating a js object or type
function NamespaceContext(){
  this.ns = null;  //full namespace string e.g. www.bond.co.uk/jsocs/something
  this.type_ = {}; //e.g. type_[mytype]  types referenceable by rulesets in this or parent context
  //this.rootRuleSet = null; //tree of RuleSets NOT USED?
  this.ns_ = {};  //e.g. ns_[prefix] = {other ns context} other namespace rules this context references
}
NamespaceContext.prototype.getById=function(refId){
  var dotPos = refId.indexOf('.');
  if(dotPos>-1){
    var nsPrefix = refId.substring(0, dotPos);
    var nsCtx = this.ns_[nsPrefix];
    if(nsCtx) {
      return nsCtx.getById(refId.substring(dotPos+1));
    }
    else{
      throw "refid "+refId+" refers to invalid ns prefix: "+nsPrefix;
    }
  }
  else{
    return this.type_[refId];
  }
};

//parse a property name and value to produce a PropertyRuleSet object
function compileJSOCSProperty(propValue, _propName, _ctx) {	
	var propName = _propName || ROOT_PROPERTY_NAME;
	var ctx = _ctx || new NamespaceContext();
	
    var ruleValues = propValue instanceof Array ? propValue : propValue===null?[]:[propValue];    
	var ruleNames = propName.split(seperator); //split property name into parts (rule names) seperated by '_'
	var ruleSet = new PropertyRuleSet(ruleNames[0]);
	
	//more than one rule name, and doesn't begin with 'jsocs'
	if(ruleNames.length>1 && propName.indexOf(JSOCS_PREFIX)!=0) {//propName_rule_rule : [ruleVal, ruleVal]
		for(var i=1; i<ruleNames.length; i++) {		  
		  var ruleName = ruleNames[i];
		  var ruleValue = ruleValues[i-1];		  	  	  	  
		  if(!ruleSet.appendRule(ctx, ruleName, ruleValue)) {
		  	throw "rules for property '"+ruleNames[0]+"' includes invalid rule name '"+ruleName+"'";
			//console.warn("rules for property '"+ruleNames[0]+"' includes invalid rule name '"+ruleName+"'");
		  }
		}
	}
	else { //0 or 1 rule name or starts with 'jsocs'
	  var addRulesFromObject = false;
	  if(ruleNames.length==1 && propName.indexOf(JSOCS_PREFIX)!=0) {  //propName : {rules}
	  	 addRulesFromObject = true;
	  }
	  else if(ruleNames.length>1 && propName.indexOf(JSOCS_PREFIX)==0) {  //jsocs_ns or jsocs_<id> or jsocs_ns_prefix
	  	if(ruleNames.length==2) { //jsocs_ns or jsocs_<id>
	  		if(ruleNames[1]=='ns') {  //jsocs_ns:"namespace for this schema branch",
	  			console.log("Setting context namespace "+ruleValues[0]);
	  			ctx.ns = ruleValues[0];
	  		}
	  		else { //jsocs_[id] : {rules}.  reusable type definition
	  		    var id = ruleNames[1];
	         	ruleSet.appendRule(ctx, "id", id);
				addRulesFromObject = true;
	  		}
	  	}
	  	
	  	//jsocs_ns_prefixA : {jsocs_ns:"schema A namespace", jsocs_url:"default url to look for it"},
        //jsocs_ns_prefixB : {normal in line schema for prefixB, with or without a namespace},
	  	else if(ruleNames.length==3 && ruleNames[1]=='ns') {
	  		var nsPrefix = ruleNames[2];
	  		if(typeof ruleValues[0] == 'object') {
	  			if(!ctx.ns_[nsPrefix]) {	  			
	  				console.log("Adding rules under namespace prefix '"+nsPrefix+"'");    
	  			    var newCtx = new NamespaceContext();
	  			    compileJSOCSProperty(ruleValues[0], null, newCtx);
	  				ctx.ns_[nsPrefix] = newCtx;
	  			}
	  			else {
	  				throw "Namespace prefix "+nsPrefix+" is declared twice";
	  			}
	  		}
	  		else {
	  			throw "Invalid namespace reference for prefix: "+nsPrefix;
	  		}
	  	}
	  }
	  
	  if(addRulesFromObject && typeof ruleValues[0] == "object") { //for propName : {rules} or jsocs_<id> : {rules}
	  	  var rulesObj = ruleValues[0];
		  for(var p in rulesObj){
		  	  var ruleName = p;
		  	  var ruleValue = rulesObj[p];		  	  	  	  
			  if(!ruleSet.appendRule(ctx, ruleName, ruleValue)) {
			  	console.warn("rules for property '"+propName+"' includes invalid rule name '"+ruleName+"'");
			  }
		  }
	  }
	  
	}
	
	if(ruleSet.inclusion === null) {
		ruleSet.appendRule(ctx, RuleOption.OPTIONAL.suffix, null);		
	}
	
	return ruleSet;
}

//turn a {name:jsocs} based object into a {name:PropertyRuleSet} based object.
function compileJSOCSObject(obj, ctx) {
	var objRules = {};
	for(var propName in obj) {
		var ruleSet = compileJSOCSProperty(obj[propName], propName, ctx);
		if(ruleSet.name!=JSOCS_PREFIX) {
			objRules[ruleSet.name] = objRules[propName]==null ? ruleSet : objRules[propName].mergeIn(ruleSet);
		}
	}
	return objRules;
}



//e.g. inclusion
function RuleType(allowMultipleRules){
  this.allowMultipleRules = allowMultipleRules || false;
}
RuleType.INCLUSION = new RuleType(); //req opt bad
RuleType.REFERENCE = new RuleType(true); //ref id unique keyid keyref
RuleType.ARRAY_TYPE = new RuleType(); //one arr enum
RuleType.DATA_TYPE = new RuleType(); //str num obj bool fn
RuleType.RESTRICTION = new RuleType(true); //rgx min max prn


//ruleTypes..
//reference typeref or typeid, keyid keyref, unique
//inclusion required/optional/illegal
//group type array enum or single 
//data type string number boolean function
//restriction regex min max precision


//for particular rule instance, like max: 20
function Rule(ruleOption, ruleValue){
  this.ruleOption = ruleOption;
  this.ruleValue = ruleValue;
}
Rule.prototype.validate = function(vCtx){
	vCtx.ruleValue = this.ruleValue;
		
	if(typeof vCtx.value=="object" || typeof vCtx.ruleValue=="object") {
		console.log("Validating..");
		console.log(vCtx.value);
		console.log("..against "+this.ruleOption.name+" rule with value..");
		console.log(vCtx.ruleValue);
	}
	else {
		console.log("Validating "+vCtx.value+" against "+this.ruleOption.name+" rule with value "+vCtx.ruleValue);
	}
	
	var isValid = this.ruleOption.validate(vCtx);
	
	console.log("Result : "+isValid);	
	
    return isValid;
}


//e.g. opt or option which is owned by the inclusion type
function RuleOption(opt){
	this.suffix = opt.suffix;
	this.name = opt.name;
	this.ruleType = opt.ruleType;
	this.validate = opt.validate || function(vCtx){
		return true
	};
	
	ruleOptions[this.suffix] = this;
	ruleOptions[this.name] = this;	
};

//indicates the id used to refer to the ruleset
RuleOption.ID = new RuleOption({
    suffix:"id", 
    name:"id",
    ruleType:RuleType.REFERENCE,
    validate:function(vCtx){
    	return true;
    }
  });
  
//indicates the id of the ruleset you want to apply
RuleOption.IDREF = new RuleOption({
    suffix:"idref", 
    name:"idref",
    ruleType:RuleType.REFERENCE,
    validate:function(vCtx){
    	return true;
    }
  });

//indicates to the object validator that null is NOT a valid value
//if it has a value, further rules can be applied to check it.
RuleOption.NOTNULL = new RuleOption({
    suffix:"nn", 
    name:"notnull",
    ruleType:RuleType.RESTRICTION,
    validate:function(vCtx){
    	if(vCtx.value==null) {
    		vCtx.errors.push("Value is null at: "+vCtx.currentPath);
    		return false;
    	}
    	return true;
    }
  });

//DEFAULT indicates to the object validator that null is also valid value
RuleOption.ALLOWNULL = new RuleOption({
    suffix:"n", 
    name:"allownull",
    ruleType:RuleType.RESTRICTION
});

//indicates an object is valid with or without the property (value is irrelevant)
RuleOption.OPTIONAL = new RuleOption({
    suffix:"opt", 
    name:"optional",
    ruleType:RuleType.INCLUSION
  });
  
//indicates an object is valid only if the property is present (value is irrelevant)
RuleOption.REQUIRED = new RuleOption({
    suffix:"req", 
    name:"required",
    ruleType:RuleType.INCLUSION
  });
  
//indicates an object is invalid if the property is present (value is irrelevant)
RuleOption.ILLEGAL = new RuleOption({
    suffix:"bad", 
    name:"illegal",
    ruleType:RuleType.INCLUSION,
    validate:function(vCtx){
      vCtx.errors.push("Value shouldn't be present at: "+vCtx.currentPath);
      return false; //should have failed earlier
    }
  });
  
//indicates if the property or array element has a value, it must be of type number
RuleOption.NUMBER = new RuleOption({
    suffix:"num", 
    name:"number",
    ruleType:RuleType.DATA_TYPE,
    validate:function(vCtx){
      if(typeof vCtx.value !== "number") {
      	vCtx.errors.push("Value is not of type 'number' at: "+vCtx.currentPath);
      	return false;      	
      }
      return true;
    }
  });
  
//indicates if the property or array element has a value, it must be of type string
RuleOption.STRING = new RuleOption({
    suffix:"str", 
    name:"string",
    ruleType:RuleType.DATA_TYPE,
    validate:function(vCtx){
      if(typeof vCtx.value !== "string") {
      	vCtx.errors.push("Value is not of type 'string' at: "+vCtx.currentPath);
      	return false;      	
      }
      return true;
    }
  });
  
//indicates if the property or array element has a value, it must be of type boolean
RuleOption.BOOLEAN = new RuleOption({
    suffix:"bool", 
    name:"boolean",
    ruleType:RuleType.DATA_TYPE,
    validate:function(vCtx){
      if(typeof vCtx.value !== "boolean") {
      	vCtx.errors.push("Value is not of type 'boolean' at: "+vCtx.currentPath);
      	return false;      	
      }
      return true;
    }
  });
  
//indicates if the property or array element has a value and its a number, it must have the desired precision
RuleOption.PRECISION = new RuleOption({
    suffix:"prn", 
    name:"precision",
    ruleType:RuleType.RESTRICTION,
    validate:function(vCtx){
      var v = vCtx.value.toFixed(vCtx.ruleValue);
      if(String(vCtx.value) !== v) {      	
      	console.log(vCtx.value + " " + typeof vCtx.value + "!==" + v + " " + typeof v);
      	vCtx.errors.push("Value ("+vCtx.value+") doesn't have expected precision ("+v+") at: "+vCtx.currentPath);      	
      	return false;      	
      }
      return true;
    }
  });
  
//indicates if the property or array element has a value and its number/string, its value/length can't exceed ruleValue
RuleOption.MAX = new RuleOption({
    suffix:"max", 
    name:"maximum",
    ruleType:RuleType.RESTRICTION,
    validate:function(vCtx){
      var valid =false;
      if(typeof vCtx.value === 'string'){
        valid = vCtx.value.length<=vCtx.ruleValue;
        if(!valid) {
        	vCtx.errors.push("String is longer than the maximum allowed ("+vCtx.ruleValue+") at: "+vCtx.currentPath);
        }       
      }
      else if(typeof vCtx.value === 'number'){
        valid = vCtx.value<=vCtx.ruleValue;
        if(!valid) {
        	vCtx.errors.push("Number is higher than the maximum allowed ("+vCtx.ruleValue+") at: "+vCtx.currentPath);
        }  
      }
      return valid;
    }
  });
  
//indicates if the property or array element has a value and its number/string, its value/length must be atleast ruleValue
RuleOption.MIN = new RuleOption({
    suffix:"min", 
    name:"minimum",
    ruleType:RuleType.RESTRICTION,
    validate:function(vCtx){
      var valid =false;
      if(typeof vCtx.value === 'string'){
        valid = vCtx.value.length>=vCtx.ruleValue;
        if(!valid) {
        	vCtx.errors.push("String is shorter than the minimum allowed ("+vCtx.ruleValue+") at: "+vCtx.currentPath);
        }       
      }
      else if(typeof vCtx.value === 'number'){
        valid = vCtx.value>=vCtx.ruleValue;
        if(!valid) {
        	vCtx.errors.push("Number is lower than the minimum allowed ("+vCtx.ruleValue+") at: "+vCtx.currentPath);
        }  
      }
      return valid;
    }
  });
  
//indicates if the property or array element has a value and is a string, it must match the regex pattern in ruleValue
RuleOption.REGEX = new RuleOption({
    suffix:"rgx", 
    name:"regex",
    ruleType:RuleType.RESTRICTION,
    validate:function(vCtx){
       if(!(new RegExp(vCtx.ruleValue)).test(vCtx.value)) {
         vCtx.errors.push("Value doesn't match expected pattern ("+vCtx.ruleValue+") at: "+vCtx.currentPath);
         return false;
       }
       return true;
    }
  });
  
//indicates the property value must be one from the array given in ruleValue
RuleOption.ENUM = new RuleOption({
    suffix:"only", 
    name:"enumeration",
    ruleType:RuleType.DATA_TYPE,
    validate:function(vCtx){
         //return ruleValue.indexOf(propVaue) > -1;         
         var valid = false;
         for(var i=0; i<vCtx.ruleValue.length; i++) {
         	if(equal(vCtx.ruleValue[i], vCtx.value)) { //deep structure equality check
         		valid = true;
         		break;
         	}
         }
         if(!valid) {
         	vCtx.errors.push("Value is not one that is permitted at: "+vCtx.currentPath);
         }
         return valid;
    }
  });
  
//indicates the property must be of type array, and its elements must match the other rules specified for this property.
RuleOption.ARRAY = new RuleOption({
    suffix:"arr", 
    name:"array",
    ruleType:RuleType.ARRAY_TYPE,
    validate:function(vCtx){
    	 if(!(vCtx.value instanceof Array)) {
    	 	vCtx.errors.push("Value is not an instance of 'Array' at: "+vCtx.currentPath);
    	 	return false;
    	 }
    	 return true;
    }
  });
  
//indicates the property must be of type object, the ruleValue specifies the JSOCS for that objects properties
//At validate time the ruleValue should be compiled jsocs rulesets (see compileJSOCSObject function)
RuleOption.OBJECT = new RuleOption({
    suffix:"obj", 
    name:"object",
    ruleType:RuleType.DATA_TYPE,
    validate:function(vCtx){
        var isValid = true;
        if(typeof vCtx.value!="object") {
          vCtx.errors.push("Value is not an object at: "+vCtx.currentPath);
          isValid = false;
        }
        else {
        	//including child property validation if type is object..  
  			//if child property inclusion is valid, call validate on corresponding ruleset in rulevalue object, it with updated path.
  			
  			var currentPath = vCtx.currentPath;
  			var ruleValue = vCtx.ruleValue;
  			var value = vCtx.value;
  			
  			for(var p in ruleValue){
  			  if(!ruleValue.hasOwnProperty(p)) { 			  	
  			    console.log("Object schema doesn't have property: '"+p+"' (currentPath="+currentPath+")");
  			    continue;
  			  }
  			  var ruleset = ruleValue[p];
  			  vCtx.currentPath = currentPath + "." + p;
  			  if(value[p]===undefined && ruleset.inclusion.ruleOption==RuleOption.REQUIRED){
  			      vCtx.errors.push("Missing required property at: "+vCtx.currentPath);
                  isValid = false;
  			  }
  			  else if(value[p]!==undefined && ruleset.inclusion.ruleOption==RuleOption.ILLEGAL){
  			    vCtx.errors.push("Illegal property found at: "+vCtx.currentPath);
                isValid = false;
  			  }
  			  else if(value[p]!==undefined){ //optional or required prop found
  			    vCtx.value = value[p];
  			    isValid = ruleset.validate(vCtx);
  			  }
  			}
  			
        }
        return isValid;
    }
  });
  
//indicates the property must be of type function, the ruleValue specifies the JSOCS for that functions contact
RuleOption.FUNCTION = new RuleOption({
    suffix:"fn", 
    name:"function",
    ruleType:RuleType.DATA_TYPE,
    validate:function(vCtx){
    	 if(typeof vCtx.value=="function") {
    	 	if(!vCtx.value._WRAPPEDFN) {
    	 		//TODO apply function wrapper with jsocs for args and return type if provided    	 		
    	 	}
    	 	return true;
    	 }
    	 else {
    	 	vCtx.errors.push("Value is not a function at: "+vCtx.currentPath);
    	 	return false;
    	 }
    }
  });



/*

use wrapFn(yourObj, 'functionName', {
  object: the object containing the function property
  propName: the name of the property holding the function to wrap 
  beforeFn:function(){},  //
  afterFn:function(){},
  withThis:object,   //optional alternative object to act as 'this' in to above functions 
  wrapperName:"a name"  //string name added to the generated wrapper function with property name 'wrapperName'
});
 
*/
wrapFn = function(obj, fnProp, _conf) {
	var obj = _conf.object;
	var fnProp = _conf.fnProp;
	var conf = {
	 beforeFn: (_conf&&_conf.beforeFn) || null,
	 afterFn: (_conf&&_conf.afterFn) || null,
	 withThis: obj,
	 wrapperName: _conf.wrapperName || null //used to identify particular wrapper function
	};		
	var origFn = obj[fnProp];		
	obj[fnProp] = function() {
		var args = [];
		for(var i=0; i<arguments.length; i++) {
			args.push(arguments[i]);
		}
		//prevent wrapped function from running if beforeFn present and returns false
		var runOrigFn = true;
		if(conf.beforeFn) {
			runOrigFn = conf.beforeFn.apply(conf.withThis, arguments);
		}			
		//run wrapped function 
		var returnVal = undefined;
		if(runOrigFn) {
		   returnVal = origFn.apply(conf.withThis, arguments);
		}
		//run afterFn to process return value if required
		if(conf.afterFn)
		  returnVal = conf.afterFn(returnVal);
		return returnVal;
	}
	if(conf.wrapperName)
	  obj[fnProp].wrapperName = conf.wrapperName;
	obj[fnProp]._WRAPPEDFN = origFn;
};
	
function unwrapFn(obj, fnProp, _conf) {
    //not a function or wrapped function
    if(typeof x.obj[x.fnProp] != "function" || !x.obj[x.fnProp]._WRAPPEDFN) {
    	return x.obj[x.fnProp]; //return value as is
    }
    else if(x.obj[x.fnProp].wrapperName) {
    	if(_conf.wrapperName && x.obj[x.fnProp].wrapperName === _conf.wrapperName) {
    		return x.obj[x.fnProp] = x.obj[x.fnProp]._WRAPPEDFN;
    	}
    }
    else {
	  return x.obj[x.fnProp] = x.obj[x.fnProp]._WRAPPEDFN;
    }
};



//expose public things
var JSOCS = {
  validate: validate,
  compile: compile,
  equal: equal
};

if(typeof window.mbx == "undefined")
  window.mbx={};
window.mbx.JSOCS = JSOCS;

if(define && typeof define === "function" && define.amd) {
	define([], function(){return JSOCS});
}


})();
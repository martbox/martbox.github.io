/*
 * jsid JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)

tool for replacing string id references to other objects within a js data model with actual references to those objects

a string id can be of the form..

IDREF:<id type ref>:idValue
or
IDPATH:child.child:idValue

The last name in a path must be the property name
on which to find the id value (e.g. 'id')
 
e.g. {a:{b:[{c:123},{d:{e:345}}]}}
IDPATH:a.b.d.e:345
* here array b is searched for objects with property name d..
..whose object has a property e with value 345.

*/
(function(){ //shield

var NumberRegex = /^[0-9]+$/;

var log = (window.logHandler && window.logHandler('JSID')) || function log(msg) {
	if(msg)
	  console.log(msg);
}
log.debug = true;



/*
* finds and returns the object with the given id, using the given path, inside fromObj.
where
nextObj = fromObj[nextProp]
and
path = [nextProp]+nextPath
*/
function resolveIdPath(fromObj, path, id) {
  log(log.debug && "Resolving path "+path+" to id "+id);
  var firstDot = path.indexOf('][');
  var nextPath = null;
  var nextProp = path.substring(1, path.length-1);
  var targetObj = null;
  var nextObj = null;
  if(firstDot>-1){
    nextProp = path.substring(1, firstDot);
    nextPath = path.substring(firstDot+1);
  }
  if(fromObj instanceof Array){
    if(NumberRegex.test(nextProp)){
      nextObj=fromObj[number(nextProp)];
      targetObj=resolveIdPath(nextObj, nextPath, id);
    }
    else {
      for(var i=0; i<fromObj.length; i++){
        var el = fromObj[i];
        if(el.hasOwnProperty(nextProp)){
          targetObj=resolveIdPath(el, path, id);
          if(targetObj!=null)
            break;
        }
      }
    }
  }
  else if(typeof fromObj == 'object'){
    if(nextPath==null) {
      //we're on the object with id property in it
      //TODO return object matching path if not locating an id
      log(log.debug && "checking for id "+id+" on '"+nextProp+"' property");
      if(fromObj.hasOwnProperty(nextProp) && fromObj[nextProp]===id){
        log(log.debug && "matching id found");
        targetObj = fromObj;
      }
      else if(fromObj[nextProp]!==undefined){
        log(log.debug && "value: "+fromObj[nextProp]+"doesn't match id "+id);
      }
    }
    else {
      nextObj=fromObj[nextProp];
      targetObj=resolveIdPath(nextObj, nextPath, id);
    }
  }
  return targetObj;
};



/*
*locates and returns reference to object found with the given idString starting in fromObj.
* returns idString as is if it is not actually in a valid IDString format.
*/
function resolveIdString(fromObj, idTypeResolver, idString){
  var idPath=null, id=null;
  var retValue = idString;
  if(IDString.isValid(idString, false)) { //false = don't fail on error
    var idObj = new IDString(idString);
    id = idObj.id;
    if(idObj.isIdRef()) {
    	log(log.debug && "Looking up ID path for ID ref name: "+idObj.idRef);
	    if(idTypeResolver.hasOwnProperty(idObj.idRef))
	      idPath=idTypeResolver[idObj.idRef];
	    else
	      throw "idRef '"+idObj.idRef+"' not found on idTypeResolver given";
    }
    else if(idObj.isIdPath()) {
    	idPath = idObj.idPath;
    }
  }
    
  if(idPath){
  	log(log.debug && "ID path found: "+idPath);
  	idPath = normalizePath(idPath);
    retValue = resolveIdPath(fromObj, idPath, id);
  }
  
  return retValue;
};


//for parsing an ID string of the form   IDREF:<id type name>:<id>  or  IDPATH:<id path>:<id>
function IDString(idString, pathOrType, id) {
  var sections = arguments;
	if(arguments.length==1 && IDString.isValid(idString, true)) {
		this.idString = idString;
	  sections = idString.split(':');
	}
	else if(arguments.length==3) {
	  this.idString = [
	    arguments[0],
	    arguments[1],
	    arguments[2]
	  ].join(':');
	}
	else {
	  throw "Invalid constructor call, 1 or 3 params needed";
	}
	
		this.type = sections[0];
	  this.isIdRef = function() {
	    return this.type===IDString.Type.IDREF
	  };
	  this.isIdPath = function() {
	    return this.type===IDString.Type.IDPATH
	  };
	  this.idRef = this.isIdRef() && sections[1];
	  this.idPath = this.isIdPath() && sections[1];
	  this.id = sections[2];
	  
	  log(log.debug && "Constructed IDString "+sections[0] + ":" + sections[1] + ":" + sections[2]);
}
IDString.isValid = function(idString, failOnError) {	
	if(!/(IDREF:[^:]+:[^:]+)|(IDPATH:[^: ]+:[^:]+)/.test(idString)) {
		if(failOnError)
			throw "idString "+idString+" is not valid (Should be \"IDREF:<id ref name>:<id string>\" or \"IDPATH:<id path>:<id string>\" ";
		else
		    return false;
	}
	return true;
}
IDString.Type = {
	IDREF : "IDREF",
	IDPATH : "IDPATH"
};



/**
 * replace an IDREF or IDPATH type string id references with 
 * references to the actual objects they refer to within the given object model
 */
function resolveIds(root, idTypeResolver, obj){
   log(log.debug && "resolveIds..");
   if(obj == undefined){
     var obj = root;
   }
   if(obj instanceof Array) {
   	 log(log.debug && "scanning array elements..");
     for(var i=0; i<obj.length; i++){
       log(log.debug && "inspecting element "+i+"..");
       if(typeof obj[i] == 'string'){
         obj[i]=resolveIdString(root, idTypeResolver, obj[i])
       }
       else {
         resolveIds(root, idTypeResolver, obj[i]);
       }
     }
   }
   else if(typeof obj == 'object'){
   	 log(log.debug && "scanning object properties..");
     for(var p in obj){
       log(log.debug && "inspecting property '"+p+"'..");
       if(typeof obj[p] == 'string'){
         obj[p]=resolveIdString(root, idTypeResolver, obj[p]);
       }
       else {
         resolveIds(root, idTypeResolver, obj[p]);
       }
     }
   }
   else {
   	 log(log.debug && "do nothing with type: "+typeof obj);
   }
   return obj;
}//resolveIds


//Change path format from a.b.c to [a][b][c] if not already like this
function normalizePath(_objectPath) {
  var objectPath = _objectPath;
	if(objectPath.indexOf("[")!=0) {
		objectPath = "["+objectPath;
	}
	if(objectPath.indexOf(".")>-1) {
		objectPath = objectPath.replace(/\./g, "][");
	}
	if(objectPath.lastIndexOf("]")!=objectPath.length-1) {
		objectPath = objectPath + "]";
	}
	if(objectPath!=_objectPath)
	   log(log.debug && "normalized path '"+_objectPath+"' to '"+objectPath);
	return objectPath;
}

//convert all paths referred to by the given idRefResolver to normalized form
//using normalizePath function above
function normalizeIDRefResolver(idRefResolver) {
	var normalized = {};
	for(var p in idRefResolver) {
		normalized[p] = normalizePath(idRefResolver[p]);
	}
	return normalized;
}


/**
Function for processing/transforming every value in an object model.
The function in the second argument is called for every object parameter or array element in the tree.
This example shows describes the arguments it will be given..
  function(rootObject, currentObject, <string param name or integer element index>, pathToCurrentParam, dataObjYouPassedIn){ }
@inner
@param {Object} root object model to process
@param {Object} processFn function used to process every object param in the model
@param {Object} data optional object always made available to processFn
 */
function processModel(root, processFn, data) {
	log(log.debug && "processModel..");
	var processedObjects = []; //to handle cyclical references safely
	
	function _processModel(currentObj, path) {
			
		//TODO support excludes/includes path patterns like in ant?
		var nextItem=null, i=0, p=0;
		if(processedObjects.indexOf(currentObj)>-1){
		  //skip as already processed
		  log(log.debug && "Skipping object at "+path+" as already processed");
		}
		else {
			log(log.debug && "Processing object at "+path);
			if(currentObj instanceof Array) {
			   processedObjects.push(currentObj);
		      for(i=0; i<currentObj.length; i++){
		      	 processFn(root, currentObj, i, path, data)!==false;
		      }
		      for(i=0; i<currentObj.length; i++){
		      	 nextItem = '['+i+']';
		      	 _processModel(currentObj[i], path+nextItem);
		      }
		   }
		   else if(typeof currentObj == 'object'){
		     processedObjects.push(currentObj);
		     for(p in currentObj){
		      	 processFn(root, currentObj, p, path, data)!==false;
		     }
		     for(p in currentObj){
		      	 nextItem = '['+p+']';
		      	 _processModel(currentObj[p], path+nextItem);
		     }
		   }
		   else {
		   	// log("do nothing with type: "+typeof currentObj);
		   }
		}
	}	
	_processModel(root, "");
	
	processedObjects = [];
	return root;
}



/**
 * Replace references to actual objects at paths found in the given idRefResolver with
 * IDREF strings instead.
 */
function applyIds(model, _idRefResolver){
	log(log.debug && "applyIds..");
	var idRefResolver = normalizeIDRefResolver(_idRefResolver);
    var data = {}; //not used
	var ID_STRING_PROP = "_IDString";
	var idPathResolver = {}; //IDPATH : IDREF
    for(var idRef in idRefResolver) {
   	   idPathResolver[idRefResolver[idRef]] = idRef;
   	}

//three model transformations...
   	log(log.debug && "addIDTypes..");
	processModel(model, function(root, currentObj, nameOrIndex, currentPath){
	  
	  var pathToProp = currentPath + "["+nameOrIndex+"]";
	    log(log.debug && "addIDTypes processing "+pathToProp);
	    var refType = null;
		if(idPathResolver.hasOwnProperty(pathToProp)) { //try lookup with specific array element e.g. a.b[2].c[4]
		  refType = idPathResolver[pathToProp];
		}
		else { //else lookup with ANY array element e.g. a.b.c
			pathToProp = pathToProp.replace(/\[\d+\]/, ""); //changes [a][2][b] to [a][b]
			if(idPathResolver.hasOwnProperty(pathToProp)) { //try lookup with specific array element e.g. a.b[2].c[4]
			  refType = idPathResolver[pathToProp];
			}
		}
		if(refType!=null) {
			var newIDString = new IDString(
			  IDString.Type.IDREF,
			  refType,
			  currentObj[nameOrIndex]);
			  
			log(log.debug && "Adding "+ID_STRING_PROP+" = '"+newIDString.idString+"' to object at "+newIDString.idString);
			currentObj[ID_STRING_PROP]=newIDString.idString;
		}
	}, data);
   
   	log(log.debug && "replaceObjectRefs..");
	processModel(model, function(root, currentObj, nameOrIndex, currentPath){	   
	   log(log.debug && "replaceObjectRefs processing "+currentPath+"["+nameOrIndex+"]");
	   if(currentObj[nameOrIndex]!=null && typeof currentObj[nameOrIndex] === "object" 
	     && currentObj[nameOrIndex].hasOwnProperty(ID_STRING_PROP)) {
	   	
	   	   log(log.debug && "Replacing object reference "+currentPath+"["+nameOrIndex+"] with string id "+currentObj[nameOrIndex][ID_STRING_PROP]);
	   	   currentObj[nameOrIndex] = currentObj[nameOrIndex][ID_STRING_PROP];
	   }
	}, data);   

	log(log.debug && "removeIDTypes..");
	processModel(model, function(root, currentObj, nameOrIndex, currentPath){
	   log(log.debug && "removeIDTypes processing "+currentPath+"["+nameOrIndex+"]");
	   if(nameOrIndex===ID_STRING_PROP) {
	   	 log(log.debug && "removeIDTypes deleting "+currentPath+"["+nameOrIndex+"]");
	     delete currentObj[ID_STRING_PROP];
	   }
	}, data);   
   
   return model;
}

var JSID = {
  resolveIds : resolveIds,
  applyIds : applyIds,
};

if(typeof window.mbx == "undefined")
   window.mbx = {};
window.mbx.JSID = JSID

if(define && typeof define === "function" && define.amd) {
	define([], function(){return JSID});
}

})(); //shield
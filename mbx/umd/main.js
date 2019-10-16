
(function(scope){ //shield global with self executing function
var require = scope.require || null,
    define = scope.define || null,
    module = scope.module || null,
    Loader = scope.Loader || null;

function log(msg){
	console.log(msg);
}
	
	
/**************** require function adapter **************/

//add require function spec implemented in different ways
(function(){
    
  if(require && (require.amd || require.cjs || require.loader))
    return; //already done
    
  var r = null; //new require function
	
  //AMD
  if(define && typeof define === "function" && define.amd) {
  	var ar = require;
  	r = function(deps, callback){
	  		if(typeof deps=="string")
	  			return require.sync(deps);
	  		else
	  			ar(deps, callback);	  
  		};
    r.amd = true;
    log("AMD loader found");
  }
  
  //CommonJS
  else if(module && typeof module === "object" && module.hasOwnProperty("exports")) {
      var sr = require;
      r = function(deps, callback){
        if(typeof deps == "string")
          return sr(deps);
        else { 
          var args = [];
          for(var i=0; i<deps.length; i++) {
            args.push(sr(deps[i]));
          }
          return callback.apply(this,args);
        }
      };
      r.cjs = true;
      log("CJS loader found");
  }
  
  //Loader
  else if(Loader) {
    r = Loader.load;
    r.loader = true;
    log("Loader found");
  }
  
  else {
  	console.error("No script loader found");
  	r = function(){
  		console.error("No script loader found, require not implemented");
  	};
  }
  
  require = r;
})();


//make require function operate the same for AMD/CJS
/*
!function(){if(!require||!(require.amd||require.cjs||require.loader)){var e=null;if(define&&"function"==typeof define&&define.amd){var r=require;e=function(e,o){return"string"==typeof e?require.sync(e):void r(e,o)},e.amd=!0}else if(module&&"object"==typeof module&&module.hasOwnProperty("exports")){var o=require;e=function(e,r){if("string"==typeof e)return o(e);for(var i=[],n=0;n<e.length;n++)i.push(o(e[n]));return r.apply(this,i)},e.cjs=!0}else Loader?(e=Loader.load,e.loader=!0):(console.error("No script loader found"),e=function(){console.error("No script loader found, require not implemented")});require=e}}();
*/


/******************* MODULE CODE **********************/



var moduleName = "testModule" //module name or CommonJS package folder name
var env = { //evaluated immediately and accessible by the moduleFactory
	moduleSpecificStatic : 1234,  //module specific static variable
	aliasToExternalObj : null  //external object reference that must already exist at module registration time, that the module needs to access.
};
var moduleDependencies = {
  names : ["/mbx/loader/Loader"], //default list of dependencies path/package names, used if environment specific list not found (See below)
  amd : ["../loader/Loader"], //path/module names For asynch AMD loading (browser), matching expected params on moduleFactory function.
  cjs : ["/mbx/loader/Loader"], //package/module names for synch CommonJS loading (node server), matching expected params on moduleFactory function.
  loader : ["/mbx/loader/Loader"],  //urls to get dependencies from, matching expected params on moduleFactory function.
  provided : { //where depdendencies are already loaded/provided in the environment
    scope: window, //object on which to locate provided modules and add your own (defaults to window)
  	props: ["Loader"] //names of properties refering to dependencies on the scope object, matching expected params on moduleFactory function.
  }
};
var moduleFactory = function(Loader){
  if(!Loader)
    alert("no Loader dependency found");
  
  return {
    moduleWithDependency : Loader
    //otherDependency: require("other-dep.json");
   }
}


/********************* Universal module registration code ************************/

//adds the module with applicable loader or adds to scope/window object
//  see http://ifandelse.com/its-not-hard-making-your-library-support-amd-and-commonjs/
function registerModule(name, deps, factory) {
  var scope = (deps.provided && deps.provided.scope) || window; //fallback to window 
  if(require.amd) { //AMD for requirejs (browser)    
    log("Registering AMD with define call..");
    deps.amd = deps.amd || deps.names || [];
    deps.amd.push("require");
    define(deps.amd, function(){
    	var syncRequire = arguments[arguments.length-1];
    	if(!require.sync) {
    		log("Extending require function with synchronous version (commonjs wrapper)..");
    		require.sync=syncRequire;
    	}	
    	log(arguments);
    	return(scope[name]=factory.apply(this,arguments))
    });
  } 
  
  else if(require.cjs) { //node impl of commonjs (server)
    log("Loading dependencies with CJS require call..");
  	require(deps.cjs||deps.names, function(){
       module.exports = factory.apply(this,arguments); //exports property replacements works for node  
    });
  }
  
  else if(require.loader) { //no module registration to do so add to scope, load deps with Loader
    log("Loading dependencies with Loader require call..");
  	require(deps.loader||deps.names, function(){
       scope[name] = factory.apply(this,arguments); 
    });
  }
  
  else { //no module registration to do so add to scope, also assume deps already provided on scope
  	for(var i=0; deps.provided.props && i<deps.provided.props; i++) {
  		deps.provided.props[i] = scope[deps.provided.props[i]];
  	}
    scope[name] = factory.apply(this,(deps.provided && deps.provided.props) || []);
  }
};

/*
function registerModule(e,r,o){var i=r.provided&&r.provided.scope||window;if(require.amd)r.amd=r.amd||r.names||[],r.amd.push("require"),define(r.amd,function(){var r=arguments[arguments.length-1];return require.sync||(require.sync=r),i[e]=o.apply(this,arguments)});else if(require.cjs)require(r.cjs||r.names,function(){module.exports=o.apply(this,arguments)});else if(require.loader)require(r.loader||r.names,function(){i[e]=o.apply(this,arguments)});else{for(var n=0;r.provided.props&&n<r.provided.props;n++)r.provided.props[n]=i[r.provided.props[n]];i[e]=o.apply(this,r.provided&&r.provided.props||[])}}
*/
registerModule(moduleName, moduleDependencies, moduleFactory);


})(window||this); //shield

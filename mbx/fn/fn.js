

//use fn(yourObj, 'functionName').wrap()
//or fn(yourObj, 'functionName').wrap({debug:true, })

fn = function(obj, fnProp){	
	var x = {
		obj: obj,
		fnProp: fnProp
	};
	
	x.wrap = function(_conf) {
		var conf = {
		 beforeFn: (_conf&&_conf.beforeFn) || null,
		 afterFn: (_conf&&_conf.afterFn) || null,
		 debug: (_conf&&_conf.debug) || false,
		 alert: (_conf&&_conf.alert) || false,
		 withThis: (_conf&&_conf.withThis) || x.obj
		};		
		var origFn = x.obj[x.fnProp];		
		x.obj[x.fnProp] = function() {
			var args = [];
			for(var i=0; i<arguments.length; i++) {
				args.push(arguments[i]);
			}
			console.log("Entered "+fnProp+ "function with args: " + args.toString());
			if(conf.alert)
			  alert("Entered "+fnProp+ "function with args: " + args.toString());
			if(conf.debug===true || (typeof conf.debug=='function' && conf.debug.apply(conf.withThis, arguments)===true))
			  debugger;
			//prevent wrapped function from running if beforeFn present and returns false
			if(conf.beforeFn && conf.beforeFn.apply(conf.withThis, arguments)!==false)
			   origFn.apply(conf.withThis, arguments);
			else if(!conf.beforeFn)
			   origFn.apply(conf.withThis, arguments);			
			if(conf.afterFn)
			  conf.afterFn();
			//console.log("Exiting "+fnProp+ "function");
		}
		x.obj[x.fnProp]._WRAPPEDFN = origFn;
		console.log("wrapped function "+x.fnProp);
	};
	
	x.unwrap = function() {
		x.obj[x.fnProp] = x.obj[x.fnProp]._WRAPPEDFN;
		console.log("unwrapped function "+x.fnProp);
	};
	
	x.restore = x.unwrap;
	
	return x;
};

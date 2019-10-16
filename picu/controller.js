window._start = function(){

var log = function(msg){
  alert(msg);
};

log("_start()");

var ROLE={
  C:"cardiologist",
  I:"intensivist",
  R:"respirologist",
  S:"surgeon",
  D:"doctor",
  N:"nurse"
};



//wrap all params/elements of the given object/array with ko observables
var observeAll = function(obj) {
  //log("observeAll()");
    if(obj instanceof Array){
      
       for(var i=0; i<obj.length; i++){
         obj[i]=observeAll(obj[i]);
       }
       obj = ko.observableArray(obj);
    } else if(obj instanceof Object) {
      for(var p in obj){
        if(obj.hasOwnProperty(p)){
          obj[p]=observeAll(obj[p]);
        }
      }
      obj = observable(obj);
    }
    else {
      obj = ko.observable(obj);
    }
  return obj;
};//observeAll
	
var model = {
  data:{
    },
  comp:{
    },
  fn:{
    }
  };
	
	//populated from json
model.data={
  }

//additional derived/computed fields
model.data.staffByRole = {
	  intensivist:[],
	  cardiologist:[],
		respirologist:[],
		nurse:[],
		doctor:[],
		surgeon:[]
};


model.fn.clearModel = function(){
	    //todo
};//clearModel
  
  
  model.fn.initWithJSON=function(jsonData){
    //log("initWithJSON()");
	     var jsObj = JSON.parse(jsonData);
	     for(var p in jsObj){
	       jsObj[p]=observeAll(jsObj[p]);
	     }
	     
//change id's to object refs
	     for(var i=0; i<model.data.rooms().length; i++){
	       var room=model.data.rooms()[i]();
	       for(var j=0;j<room.beds().length; j++){
	         var id = room.beds()[j];
	         room.beds()[j] = model.fn.getPatient(id);
	       }
	     }
	     
	     model.fn.addComputedFields();
	     };//initWithJSON
	     
	     
model.fn.resolveIdPath=function(fromObj, path, id) {
  
};

model.fn.resolveIdString=function(fromObj, resolver, idString){
    var IDREF='IDREF'; //e.g. IDREF:idType:idToMatch
  var IDPATH='IDPATH'; //e.g. IDPATH:parent.childArray.elementField.objField:idToMatch
  
};

  }
	     
model.fn.ids2Objects=function(model, obj, resolver){

   if(obj===null)
     return null;
   else if(obj instanceof Array) {
     
   }
   else if(typeof obj == 'object'){
	   for(var p in obj){
	     if(typeof obj[p]=='string') {
	       var s=obj[p].split(':');
	       var idPath=null;
	       var id=null;
	       if(obj[p].indexOf(IDREF)===0){
	         var idType=s[1];
	         idPath=resolver[idType];
	         id=s[2];
	         
	       }
	       else if(obj[p].indexOf(IDPATH)===0){
	         idPath=s[1];
	         id=s[2];
	       }
	       if(idPath && id){
	         //locate object at idPath with matching id
	         var path = idPath.split('.');
	         var target = obj;
	         for(var i=0; i<path.length; i++){
	         target = obj[path[0]];
	           
	         if(target instanceof Array) {
	           if(path[i+1].matches(/[0-9]+/)) {
	             //array index
	             path[i+1]=number(path[i+1]);
	           }
	           else {
	             //search all elements
	             for(var j=0; j<target.length; j++){
	               
	             } 
	           }
	         }
	           
	         target = target[path[i]];
	         }
	       }
	     }
	   }
	 }
}
	     
	  model.fn.addComputedFields=function(){
	  for(var i=0; i<model.data.staff().length; i++){
	  var sm=model.data.staff()[i];
	  sm().full = ko.computed(function(){
	    return this.name()+" "+this.bleep();
	  },sm);
	  sm().initials = ko.computed(function(){
	    var arr = this.name().split(' ');
	    var initials = "";
	    for(var i=0; i<arr.length; i++){
	      initials+=arr[i].charAt(0);
	    }
	    return initials;
	  },sm);
	  var sl=model.fn.getStaffWithRole(sm().role);
	  sl.push(sm());
	  }
	 };
	 
		model.fn.getStaffWithRole=function(role) {
		  var sl = [];
		  if(role==ROLE.I)
		    sl=model.comp.intensivists();
		  if(role==ROLE.C)
		    sl=model.comp.cardiologists();
		  if(role==ROLE.R)
		    sl=model.comp.respirologists();
		  if(role==ROLE.S)
		    sl=model.comp.surgeons();
		  if(role==ROLE.D)
		    sl=model.comp.doctors();
		  if(role==ROLE.N)
		    sl=model.comp.nurses();
		  //log("found "+sl.length+" staff with role '"+role+"'");
		  return sl;
		};//initComputedData
			
			
model.fn.getPatient=function(id){
  var retP=null;

  for(var i=0; i<model.data.patients().length; i++){
    var patient=model.data.patients()[i];
    if(patient().id==id) {
      retP=patient();
      break;
    }
  }
  if(retP==null){
      retP = {
        id:id,
        name: id,
        status:"",
        specialist:"",
        surgeon:"",
        nurse:"",
        doctor:""
      };
  }
  log(id + " is "+retP.name);
  return retP;
};
			
			
		model.fn.loadFromLocal=function(){
		  //todo
			};
			
		model.fn.saveToLocal=function(){
		  //todo
			};
			
		model.fn.saveStaffMember=function(){
		  //todo
			};
			
		model.fn.deleteStaffMember=function(){
		  //todo
			};
			
		model.fn.swapPatientFrom=function(room, bed){
		  //todo
			};
			
		model.fn.cancelPatientSwap=function(){
		  //todo
			};
			
		model.fn.swapPatientTo=function(){
		  //todo
			};
	
	
//init code

//todo load data into model
var jsonString = JSON.stringify(testData);
model.fn.initWithJSON(jsonString);
//log("ko.applyBindings()");
ko.applyBindings(model);

//_start()


window.start = function(){
  try {
    //alert("start()");
    _start();
  }
  catch(e){
    alert(e.description||e);
  }
}; //start()



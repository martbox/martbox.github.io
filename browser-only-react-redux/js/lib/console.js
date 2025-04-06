/*!
 * console.js v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * 
 * Provides simple console capture and display via clicking big yellow CONSOLE button
 * added on the page (useful on devices where you don't get a console)
 */

var wrappedConsole = null;
if(top.console) {
	wrappedConsole = top.console;
}

function getConsolePosition() {
  var position = [50,700];
  try {
    position = document.querySelector("script[data-position]").dataset["position"].split(",");
  } catch(e) {
    alert("script with dsta-position not found, defaulting to 50,50");
  }
  return {
    x:position[0]+"px",
    y:position[1]+"px"
  };
}

top.console = {
  bufferSize : 50,
  entries : [],
  log:function(msg, e){
    console.entries.push(msg);
    if(wrappedConsole)
    	wrappedConsole.log(msg);
    if(e && e.stack)
        wrappedConsole.log(e.stack);
    console.showLast(console.bufferSize);
  },
  clear:function() {
    console.entries=[];
    console.close();
  },
  display:function(){
  	console.close();
    var div = document.getElementById('console-div');
    if(div==null) {
 	   div = document.createElement("div");
 	   div.id="console-div";
 	   div.style.position = "absolute";
 	   div.style.top = "50px";
 	   div.style.left = "0px";
 	   //div.style.maxWidth = "90%";
 	   div.style.maxHeight = "90%";
 	   div.style.overflow = "auto";
 	   div.style.backgroundColor = "white";
 	   div.style.padding = "0px 20px 0px 10px";
 	   
 	   var content = "<span onclick='console.close()' style='cursor:pointer'>[ CLOSE ]</span>";
 	   content += " <span onclick='console.clear()' style='cursor:pointer'>[ CLEAR ]</span><br/>";
 	   content += "<pre id='console-text' style='line-height:10px'>";
 	    content+="</pre>";
 	    div.innerHTML = content;
 	    document.body.appendChild(div);
    }
    console.showLast(console.bufferSize);
  },
  close:function(){
    var div=document.getElementById("console-div");
    if(div)
    	div.parentNode.removeChild(div);
  },
  showLast:function(num) {
    var start = 0;
    var entries=console.entries;
    if(num<entries.length) {
      start=entries.length-num;
    }
    
    /*
    for(var i=start; i<entries.length; i++){
      if(!confirm(entries[i]+"\n\nShow next log entry?")){
        break;
      }
    }
    */
    
    var consoleText = document.getElementById('console-text');
    if(consoleText!=null) {
      var text = "";
      for(var i=start; i<entries.length; i++){
    	  text += entries[i] + "\n\n";
	  }
      consoleText.innerHTML = text;
    }
  }
  
  
};//top.console
top.console.error = function(msg, e){
  top.console.log("ERROR: "+msg, e);
};
top.console.err = top.console.error;
top.console.warn = function(msg, e){
  top.console.log("WARN: "+msg, e);
};
top.console.info = function(msg, e){
  top.console.log("INFO: "+msg, e);
};
top.console.debug = function(msg){
  top.console.log("DEBUG: "+msg);
};



document.addEventListener("DOMContentLoaded", function(event) { 
	
   var openConsoleDiv = document.createElement("div");
   openConsoleDiv.id="openConsoleDiv";
   openConsoleDiv.style.position = "absolute";
   openConsoleDiv.style.height = "30px";
   openConsoleDiv.style.width = "80px";
   openConsoleDiv.style.top = getConsolePosition().y;
   openConsoleDiv.style.left = getConsolePosition().x;
   openConsoleDiv.style.backgroundColor = "yellow";
   openConsoleDiv.style.overflow = "auto";
   openConsoleDiv.style.zIndex = 1100;
   openConsoleDiv.style.cursor = "pointer";
   openConsoleDiv.style.padding = "auto";
   openConsoleDiv.onclick = top.console.display;
   openConsoleDiv.innerText = "CONSOLE";
   document.body.appendChild(openConsoleDiv);
   
});

window.onerror=function(msg,src,line,col,error){
  console.err(msg+" ("+src+":"+line+(col?","+col:"")+")");

  if(error && error.stack) {
    console.err("   stack:"+error.stack);
  }

}



/**
 * xml-editor.js
 * Allows a number of XMLEditor instances to be added into a page (using template editor-view.html)
 * Each has their own load/save buttons and an iframe loading a xonomy-container.html.
 * xs-parser.js is a required dependency in the page.
 */

(function(){
	
/**
Load content from given url
*/
function loadContent(url, callback) {
     $.ajax({
        async:false,
        url:url,
        success:callback
      });
}
	
var DOM_ID = {
  IFRAME:"xonomy-container-",
  SAVE_BUTTON:"save-button-",
  DOWNLOAD_BUTTON:"download-button-"
};
function $for(domId, instanceId){
	return $("#"+domId+instanceId);
}
	
	
/**
Loads editor-view.html content, adds in the given instanceId where appropriate and 
adds to the DOM inside the given parent element, then runs the given callback.
*/
function loadView(parentEl, instanceId, callback) {
	self
  loadContent("editor-view.html", function(viewHtml){
    parentEl.innerHTML = viewHtml.replace(/\{instance\}/g, instanceId);
    if(typeof callback=="function") {
    	 var iframe = document.getElementById("xonomy-container-"+instanceId);
       iframe.onready = callback;
    }
  });
}

/**
Save text content to file like its a download.
(Max on a data url is 2Mb I think)
*/
function saveXML(filename, xml){
    var link = document.createElement("a");
    link.setAttribute("target","_blank");
    if(Blob !== undefined) {
        var blob = new Blob([xml], {type: "text/xml"});
        link.setAttribute("href", URL.createObjectURL(blob));
    } else {
        link.setAttribute("href","data:text/xml," + encodeURIComponent(xml));
    }
    link.setAttribute("download",filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



			

var XMLEditor = function(conf){		
	var parentEl = conf.parentEl;
	var id = conf.id;
	var onload = conf.onload || function(){};
		
	if(typeof XSParser=="undefined" || XSParser==null) {
	  throw "xs-parser.js not found, it should be loaded before xml-editor.js";
	}
	if(!parentEl || !(parentEl instanceof Element)) {
		throw "Missing parent element to render xml editor instance into";
	}
	if(!id || !(/^[a-z]{1}[a-z0-9_\-$]*$/i).test(id)) {
	  throw "invalid web-xml editor instance id, should match ^[a-z]{1}[a-z0-9_\-$]*$ ";
	}
	if(XMLEditor.instances.hasOwnProperty(id)) {
		throw "An xml editor instance with id '"+id+"' is already registered in the page.";
	}
	
	this.instanceId = id;
	this.iframeName = "xonomy-container-"+id;
	this.xmlSourceUrl = "";
	this.xmlContent = "";
	this.xsdSourceUrl = "";
	this.xsdContent = "";
	this.parentEl = parentEl;
	this.saveListeners = [];
	XMLEditor.instances[id] = this;
	
	var self = this;
	loadView(this.parentEl, this.instanceId, function(){
	  if(!window.frames[self.iframeName].Xonomy) {
	    throw "Error loading Xonomy editor frame";
	  }    
	  var $saveButton = $for(DOM_ID.SAVE_BUTTON, self.instanceId);
	  $saveButton.on('click', function(){self.saveHandler()});
	  var $downloadButton = $for(DOM_ID.DOWNLOAD_BUTTON, self.instanceId);
	  $downloadButton.on('click', function(){self.downloadHandler()});  
	  onload(self);
	});
}

XMLEditor.prototype.saveHandler = function(){
	this.saveToLocalStorage();
}

XMLEditor.prototype.downloadHandler = function(){
	var xml = this.getXMLFromEditor();
	saveXML("content", xml);
}

//expose externally on instance object
XMLEditor.prototype.setXSDContentFrom = function(url, callback){
	var self = this;
	this.xsdSourceUrl = url;
  loadContent(url, function(xsdContent){
     console.log("xsd content loaded from "+url);
     self.setXSDContent(xsdContent);
     if(callback)
    	 callback();
  });
};
XMLEditor.prototype.setXMLContentFrom = function(url, callback){
	var self = this;
	this.xmlSourceUrl = url;
  loadContent(url, function(xmlContent){
    self.setXMLContent(xmlContent);
    if(callback)
    	callback();
  });
};

XMLEditor.prototype.setXMLContent = function(xmlContent){
	this.xmlContent = xmlContent;
};
XMLEditor.prototype.setXSDContent = function(xsdContent){
	this.xsdContent = xsdContent;
};

/**
Sets xml content and docspec (schema) on the xonomy container and renders the editor
*/
XMLEditor.prototype.renderEditor = function(){
console.log("rendering xonomy editor");
	if(this.xsdContent==null)
	  throw "Render failed, please set xsd content first";
	
	var iframeWindow = window.frames[this.iframeName];
	if(typeof iframeWindow.render != "function") {
		console.error("render missing");
	}
	//var iframeWindow = document.getElementById(this.iframeName).contentWindow;
	
	if(iframeWindow) {	
	   iframeWindow.render(this.xmlContent || "", this.xsdContent);
	}
	else {
	   throw "iframe "+this.iframeName+" not found";
	}
};

XMLEditor.prototype.getXMLFromEditor = function(){
	var xml = null;
	var iframeWindow = window.frames[this.iframeName];
  if(iframeWindow && iframeWindow.Xonomy) {
    xml = iframeWindow.getXML();
  }
  return xml;
}

XMLEditor.prototype.saveToLocalStorage = function(callback) {
	var xml = this.getXMLFromEditor();
	localStorage.setItem("xml-content-"+this.instanceId, xml);
	console.log("XML from editor with ID '"+this.instanceId+"' saved.");
	alert("XML Content saved in browser");
	if(typeof callback=="function") {
		callback();
	}
	this.saveListeners.each(function(subscriber, index){
		subscriber(xml);
	});	
}

XMLEditor.prototype.loadFromLocalStorage = function() {
  var loadedContent = localStorage.getItem("xml-content-"+this.instanceId);
  if(!loadedContent) {
  	return false;
  }
  else {
  	this.xmlContent = loadedContent;
	  this.renderEditor();
	  return true;
  }
}

/**
Call a function when user saves
*/
XMLEditor.prototype.onSave = function(subscriber){
	if(typeof subscriber!="function") {
		throw "onSave subscriber is not a function";
	}
	this.saveListeners.push(subscriber);
};

//store all instances in the page
XMLEditor.instances = {};
XMLEditor.DOM_ID = DOM_ID;

window.XMLEditor = XMLEditor;

})();

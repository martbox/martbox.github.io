/**
 *
 * load.js JavaScript library v1.0.0
 * (c) Martin Armstrong - http://martbox.co.uk/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Simple jQuery based tool for synchronously loading/evaluating static resources in the browser
 * 
 * Usage :
 *    mbx.load.text(url) - load and return text from given url
 *    mbx.load.html(url) - load and return html from given url
 *    mbx.load.css(url) - load css from url and attach to page in <style> tag
 *    mbx.load.json(url) - loads json text from url, evaluates as js object and and returns it
 *    mbx.load.js(url) - load and evaluate js from url
 */

(function(){
	
//check required global objects
var moduleName = "load",
required = ["jQuery"];
required.forEach(function(dependency){
	if(typeof window[dependency]==="undefined") {
		throw "ERROR: "+moduleName+" couldn't find dependency: "+dependency;
	}
});

//remember js already loaded and evaluated
var evaluated=[];
	
/**
 * fetch a css file and inject into <style id="url">loaded content</style> if not already present
 */
function css(resourceUrl) {
	var css = jQuery.get(resourceUrl);
	if($('head#'+resourceUrl).length==0) {
		$('head').append("<style id=\""+resourceUrl+"\">"+css+"</style>");
	}
}

/**
 * fetch JS file and evaluate if not done already
 */
function js(resourceUrl) {
	var exists = false;
	$('script').each(function(index, element){
		if(element.src && resourceUrl.indexOf(element.src.replace("../", ""))>-1) {
			exists = true;
		}
	});
	if(!exists && evaluated.indexOf(resourceUrl)==-1) {
		jQuery.getScript(resourceUrl);
		exists = true;
	}
	return !exists; //returns whether evaluated already or not
}

function json(resourceUrl) {
	return JSON.parse(jQuery.get(resourceUrl));
}

function text(resourceUrl) {
	return jQuery.get(resourceUrl);
}

function html(resourceUrl) {
	return text(resourceUrl);
}

var load={
	css: css,
	js: js,
	text: text,
	html: html,
	json: json
};

if(window.mbx=="undefined")
	window.mbx = {};
window.mbx.load = load;

if(define && typeof define === "function" && define.amd) {
	define([], function(){return JSID});
}

}())
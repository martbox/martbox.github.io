
(function(){
	
	var URL = {

		getHost : function(url) {
			console.log("Getting host from: "+url);
      var root = url.match(/((http(s)?:)|(file:\/))\/\/[^\/]+/);  
      return root[0]; 
		}, 
		
		getPath : function(url){
			var currentPath = url;
      var host = URL.getHost(currentPath);
      if(currentPath.indexOf("?")>-1) //only resource path needed
        currentPath = currentPath.substring(0, currentPath.indexOf("?"));
      //chop off resource name
      if(currentPath==host) {
        currentPath = currentPath + "/";
      }
      else if(currentPath.lastIndexOf("/")!=currentPath.length-1) {
        currentPath = currentPath.substring(0, currentPath.lastIndexOf("/")+1)
      }
      return currentPath;
		},
		
		//find absolute url of relativeUrl, using currentPageUrl
		getAbsoluteUrl : function(currentPageUrl, relativeUrl){
			if(relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://") || relativeUrl.startsWith("file://")) {
				return relativeUrl; //not a relative url
			}
			
			//chop off query string
			var queryString = null;
			if(relativeUrl.indexOf("?")>-1) {
				queryString = relativeUrl.substring(relativeUrl.indexOf("?"));
				relativeUrl = relativeUrl.substring(0, relativeUrl.indexOf("?"));
			}
			
			relativeUrl = relativeUrl.replace("//", "/");
			var currentPath = URL.getPath(currentPageUrl);
			
			if(relativeUrl.indexOf("./")==0) {
				relativeUrl = relativeUrl.substring(2);
			}			
						
			var fullUrl = currentPath + relativeUrl;
			if(relativeUrl.startsWith("/")) { //relative to host
				fullUrl = URL.getHost(currentPageUrl) + relativeUrl;
			}
			else {
				var count = 0;
				for(var m=fullUrl.match(/[^\/]+\/..\//); m!=null && count<20; m=fullUrl.match(/[^\/]+\/..\//)) {
					fullUrl = fullUrl.replace(m, ""); //process ../
					count++;
				}
			}
			
			if(queryString) //put queryString back on the end if applicable
				fullUrl += queryString;
			
			return fullUrl;
		}
	}
	
if(typeof window.mbx == "undefined")
  window.mbx={};
window.mbx.URL = URL;

if(typeof define === "function" && define.amd) {
	define([], function(){return URL});
}
if(typeof module == "object") {
  module.exports = URL;
}
})();
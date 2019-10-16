

# loader

Tool for loading a group of text resources asynchronously, evaluating js/json and applying css in the page as needed, then running a callback function once all this has been done.

**
[Website](http://martbox.co.uk/mbx/loader/index.html) | 
[Github](https://github.com/martbox/loader) | 
[Download](http://martbox.co.uk/mbx/loader/Loader.js) | 
[Jasmine tests](http://martbox.co.uk/mbx/loader/test.html) | 
[License: MIT](http://www.opensource.org/licenses/mit-license.php) | 
[Author: Martin Armstrong](https://www.linkedin.com/in/martin-armstrong/)
**

# Usage

    mbx.Loader.load(
      ["script.js", "view.html", "style.css", "data.json"], //urls of resources to load
      function(resources){ }, //callback called when above resources all loaded
      doProcess  //boolean indicating whether resources should be processed after loading*
    );
      
Where 'resources' is array of objects that look like this..

    {
      url:"data.json",   //url of resource loaded
      ext:"json", //file extension
      status:5, //where:  NEW:1, REQUESTED:2, ERROR:3, LOADED:4, COMPLETE:5 (i.e. loaded text is processed)
      type:{},  //object describing how resource should be processed, depends on ext  
      content:"",  //processed content as loaded from the url (except js which are loaded by script tag)
    }
 
*doProcess : this is optional boolean indicating whether content should also be processed...
  - For css it is attached in a new style tag in the head of not done already.
  - For HTML it is added as innerHTML to a new div element (not appended to the DOM yet)
  - For JSON it is parsed to a js object.

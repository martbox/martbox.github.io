
# jsid

This is a tool for replacing string id's in a js object model with actual pointers to the objects they refer to.
It also works the other way round, replacing object pointers with string id's, useful when serialising to json string.

**
[Website](http://martbox.co.uk/mbx/jsid/index.html) | 
[Github](https://github.com/martbox/jsid) | 
[Download](http://martbox.co.uk/mbx/jsid/jsid.js) | 
[Jasmine tests](http://martbox.co.uk/mbx/jsid/test.html) | 
[License: MIT](http://www.opensource.org/licenses/mit-license.php) | 
[Author: Martin Armstrong](https://www.linkedin.com/in/martin-armstrong/)
**

## Usage ##
           
#### Here's a data model which refers to one of the objects inside with an IDPATH..

     var model1 = {
      group : {
        people: [
          {id:"123", name:"fred"},
          {id:"345", name:"dave"}
        ]
      },
      personA: "IDPATH:group.people.id:123", //here path "group.people.id:123" points to the object with name="fred"
    }
    
    //Here model1.personA => "IDPATH:group.people.id:123"
    

#### To swap string id references (personA) in model1 for object pointers instead..
    
    var model2 = jsid.resolveIds(model1);
    
    //Now model2.personA => {id:"123", name:"fred"}
    
#### You can also use a reference name in place of the id path. In this case you also need an id resolver to look up the path for this name..
    
    var idPathResolver = {
      myIDType: "[model1][people][id]"   //define the id path for ref name 'myIDType'
    };
    
    var model1 = {
      group : {
        people: [
          {id:"123", name:"fred"},
          {id:"345", name:"dave"}
        ]
      },
      personB: "IDREF:myIDType:345"  //here 'myIDType' will be used to lookup the id path in idPathResolver
    }
    
    var model2 = jsid.resolveIds(model1, idPathResolver);
    
    //Now model2.personB => {id:"123", name:"fred"}

#### To change back again to string id's instead of object pointers (if you wanted to serialise to json string for example)

    var model1 = jsid.applyIds(model2, idPathResolver);
    
    //Now model1.personA => "IDPATH:group.people.id:123"


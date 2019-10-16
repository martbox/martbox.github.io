
# observableProps

This is a simple add-on function I've used with [KnockoutJS](http://knockoutjs.com). It adds function **observableProps** to the **ko** object.
This function takes an object and returns an object where all properties are made **observable** or **observableArray**.
The property names on the returned object match those on the object passed in, and the observables assigned to them are initialised with values from the input object.

**
[Website](http://martbox.co.uk/mbx/koObservableProps/index.html) | 
[Github](https://github.com/martbox/koObservableProps) | 
[Download](http://martbox.co.uk/mbx/koObservableProps/observableProps.js) | 
[Jasmine tests](http://martbox.co.uk/mbx/koObservableProps/test.html) | 
[License: MIT](http://www.opensource.org/licenses/mit-license.php) | 
[Author: Martin Armstrong](https://www.linkedin.com/in/martin-armstrong/)
**

## Usage ##
 
    var object = {a: 123, b:"abc"};
    var newObject = ko.observableProps(object);
    newObject.a(345);
    newObject.b("def");
    
    newObject.a(); => 345
    newObject.b(); => "def"

The **newObject** returned is also actually a function you can use to update all observables at once or return an object containing plain unwrapped values.
  
    newObject({a:678, b:"ghi"});
    
    newObject.a(); => 678
    newObject.b(); => "ghi"
    newObject(); => {a:678, b:"ghi"}

There's also an option to add get/set functions onto the observables, which I sometimes use for clarity..

    var object = {a: 123, b:"abc"};
    var newObject = ko.observableProps(object, true);  << add true here
    newObject.a.set(345);
    newObject.b.set("def");
    
    newObject.a.get(); => 345
    newObject.b.get(); => "def"


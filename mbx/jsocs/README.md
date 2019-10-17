# JSOCS #

JavaScript Object/Contract Schema

This lets you validate a js object against a schema specifying the structure it should have.
It's kind of like json schema but provides a shorthand notation using underscore separated rules inside property names.

You can also make a function wrapper which validates the arguments passed to it and the value it returns.
The idea here was to allow you to spec a function contract separately from its implementation.

**
[Website](https://martbox.github.io/mbx/jsocs/index.html) | 
[Github](https://github.com/martbox/jsocs) | 
[Download](https://martbox.github.io/mbx/jsocs/jsocs.js) | 
[Jasmine tests](https://martbox.github.io/mbx/jsocs/test.html) | 
[License: MIT](http://www.opensource.org/licenses/mit-license.php) | 
[Author: Martin Armstrong](https://www.linkedin.com/in/martin-armstrong/)
**

## Usage ##

Write a spec object defining rules to validate your data.
The example below indicates a value must be present (not null), and must be an object with the given property rules.. 

    var spec : { 
      req:true,
      obj:{
        a_num_req : null,  //property 'a' is required and must be a number
        b1_str_req : null,  //property 'b' is required and must be a string
        b2 : {str:"", req:null}  //longhand version of b1        
        c_bool : null,     //property 'c' is optional but if present must be a boolean
        d_obj : {},        //property 'd' is optional but if present must be an object
	     e_str_arr : null   //property 'e' is optional array of strings
	     f_only_req : ["cat", "dog"]  //property 'f' is required and can only be "cat" or "dog" 
      }
    }

Make a validator using your spec object..

    var validator = JSOCS.compile(spec);


Run your validator passing in a js object to test..

    var isValid = validator.validate(valueToTest);




(function(){
	
	
	
	
	//build and set test_docspec object
	var docspec = new XSDocSpec();	
	XSDocSpec.logging = true;
	var XS = XSDocSpec; //shorthand alias for static references
	
	//namespaces
	docspec.namespaces['xmlns'] = 'myNS';
	
	//simple types
	docspec.simpleTypes['itemLabelType'] = new XS.SimpleType.String(/(one)|(two)/, "Text 'one' or 'two'");		
	docspec.simpleTypes['numberType'] = new XS.SimpleType.Number(5, 10, "Number between 5 and 10 (inclusive)");
	docspec.simpleTypes['dateType'] = new XS.SimpleType.Date("Date value e.g. '2017-10-27'");
	docspec.simpleTypes['booleanType'] = new XS.SimpleType.Boolean("Boolean value i.e. 'true' or 'false'");
	docspec.simpleTypes['enumType'] = new XS.SimpleType.Enumeration(["three", "four"], null, "One of 'three' or 'four'");
		
	//attribute specs
	var labelAtt = new XS.AttributeSpec();
	labelAtt.required = true;
	labelAtt.tooltip = "specify 'one' or 'two'";
	labelAtt.setType(docspec.simpleTypes['itemLabelType']);
		
	//element specs
	docspec.elementSpecs['item'] = new XS.ElementSpec({
		tooltip : "Specify an item on a list",
		attributeSpecs: {
			'label': labelAtt
		}
	});
		
	docspec.elementSpecs['numEl'] = new XS.ElementSpec({
		tooltip : "number simple element, min 5 max 10",
		simpleType : docspec.simpleTypes['numberType']
	});
			
	docspec.elementSpecs['dateEl'] = new XS.ElementSpec({
		tooltip : "date simple element yyyy-mm-dd",
		simpleType : docspec.simpleTypes['dateType']
	});
	
	docspec.elementSpecs['boolEl'] = new XS.ElementSpec({
		tooltip : "boolean simple element",
		simpleType : docspec.simpleTypes['booleanType']
	});
	
	docspec.elementSpecs['enumEl'] = new XS.ElementSpec({
		tooltip : "enum simple element, 'three' or 'four'",
		simpleType : docspec.simpleTypes['enumType']
	});
	
	//element groups
	

	var choiceGroup = new XS.ElementGroup(null, XS.ElementGroup.TYPE.CHOICE, 1, 1);
	choiceGroup.addChild(new XS.ElementGroup({
		name: "numEl", 
		type: XS.ElementGroup.TYPE.ELEMENT,
		minOccurs: 1,
		maxOccurs: 1
	}));
	choiceGroup.addChild(new XS.ElementGroup("boolEl", XS.ElementGroup.TYPE.ELEMENT, 1, 1));
	docspec.elementGroups["choiceGroup"] = choiceGroup;
	
	var allGroup = new XS.ElementGroup(null, XS.ElementGroup.TYPE.ALL, 1, 1);
	allGroup.addChild(new XS.ElementGroup("enumEl", XS.ElementGroup.TYPE.ELEMENT, 1, 1));
	allGroup.addChild(new XS.ElementGroup("dateEl", XS.ElementGroup.TYPE.ELEMENT, 1, 1));
	docspec.elementGroups["allGroup"] = allGroup;
					
	var sequenceOfGroups = new XS.ElementGroup(null, XS.ElementGroup.TYPE.SEQUENCE, 1, 1);
	sequenceOfGroups.addChild(choiceGroup);
	sequenceOfGroups.addChild(allGroup);
	docspec.elementGroups["sequenceOfGroups"] = sequenceOfGroups;
	
	var myGroup = new XS.ElementGroup(null, XS.ElementGroup.TYPE.GROUP, 1, 1);
	myGroup.addChild(sequenceOfGroups); 
	//a referencable 'group' must have a single 'all', 'sequence' or 'choice' group in it.
	// and must be registered by a name in the docspec.elementGroups
	docspec.elementGroups['myGroup'] = myGroup;
	
	var rootSequenceGroup = new XS.ElementGroup(null, XS.ElementGroup.TYPE.SEQUENCE, 1, 1);
	rootSequenceGroup.addChild(new XS.ElementGroup("item", XS.ElementGroup.TYPE.ELEMENT, 2, 2));
	rootSequenceGroup.addChild(new XS.ElementGroup("myGroup", XS.ElementGroup.TYPE.GROUP_REF, 1, 1));
		
	docspec.elementGroups['rootSequence'] = rootSequenceGroup;
	
	//root element	
	var rootElement = new XS.ElementSpec();
	rootElement.tooltip = "ROOT element. specify a list of items";
	rootElement.elementGroup = docspec.elementGroups['rootSequence'];	
	docspec.elementSpecs['list'] = rootElement;
	
	window.docspec = docspec;
	
	//always need to do this when you've finished building the docspec
	window.docspec.build();

	
})();
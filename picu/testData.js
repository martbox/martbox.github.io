
window.testData = {
		
  staff : [{
		id:"staff-0",
		name:"Angela Aramburu", 
		role:"intensivist",
		imageFile:"",
		bleep:"1234"},
		{
		id:"staff-1",
		name:"Nitin Shastri", 
		role:"intensivist",
		imageFile:"",
		bleep:"3567"}
	],
		
		
  contacts : [
		{label:"Consultant day",
		  role:"intensivist",
		  staffId:"staff-0"
		},
		{label:"Consultant night",
		  role:"intensivist",
		  staffId:"staff-1"
		}
  ],
		
		
  notes : "some notes here..",
		
		
  patients:[{
		  id:"patient-0",
		  name:"someone",
		  status:"HDU",
		  specialist:"staff-1",
		  surgeon:"staff-1",
		  nurse:"staff-1",
		  doctor:"staff-1"
		}
  ],
		
		
  rooms : [
		   {name:"BAY 1",
		     beds : [
		       "patient-0",
		       "closed",
		       "closed",
		       "empty"
		     ]
		   }
		]
	} //testData

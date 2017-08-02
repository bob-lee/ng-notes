/* 30Jul17 database restructured:

{ // old nested structure
	"notes": {
		"groupKey1": {
			"noteKey1": {
				"name: "Bob",
				"text": "Hello",
				"updatedAt": 213213213213
				"imageURL": ""
			},
			"noteKey2": {...},
			"noteKey3": {...}
		},
		"groupKey1": {...}
	}
}

{ // new flattened structure
	"groups": {
		"groupKey1": true,
		"groupKey2": true
	},
	
	"notes": {
		"noteKey1": {
			"group": "groupKey1",
			"name: "Bob",
			"text": "Hello",
			"updatedAt": 213213213213,
			"imageURL": ""
		},
		"noteKey2": {...},
		"noteKey3": {...}
	}	
}

*/
export interface Note {
  group: string;
  name: string;
  text: string;
  updatedAt: any; // for sorting
  imageURL: string;
}

export enum Todo {
  List = 0, 
  Add,
  Edit,
  Remove
}

export enum LoginWith {
  Facebook = 0, 
  Google,
  Anonymous
}
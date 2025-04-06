
import buttonClicked from "./ButtonClicked.js";

const allActions = [
  buttonClicked
];

var actionsObj = {}
allActions.forEach((action)=>{
  actionsObj[action.type]=action;
});

export default actionsObj;


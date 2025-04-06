import {createStore} from "https://unpkg.com/redux@5.0.1/dist/redux.browser.mjs"
import initialState from "./initial-state.js"

var actionsObj = {} // named Action instances

const rootReducer = (state={}, actionEvent) => {
console.debug("roodReducer called with actionEvent.type="+actionEvent.type);
if(actionEvent && !actionEvent.type.includes("@@redux/INIT")) {
      if(!!actionsObj[actionEvent.type]) {
        return actionsObj[actionEvent.type].reducer(state, actionEvent.change);
      } else {
        console.error("Unknown Action: "+actionEvent.type);
        return state;
      }
    }
    else {
      console.debug("rootReducer returning state unchanged");
      return state;
    }
};

const reduxStore = createStore(rootReducer, initialState);

export default {
  store: reduxStore, 
  setActions: (actions)=>{
    actionsObj = actions;
  },
  addAction: (action)=>{
    actionsObj[action.type] = action;
  }
}


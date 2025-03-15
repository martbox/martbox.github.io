//not an import, Redux is loaded via <script> in the page
const { createStore } = Redux;

const actionsObj = {} // named Action instances

const rootReducer = (state={}, actionEvent) => {
    if(actionEvent && actionEvent.type!="@@redux/INIT") {
      return actionsObj[actionEvent.type].reducer(state, actionEvent.change);
    }
    else
      return state;
};

const reduxStore = createStore(rootReducer);

export default {
  store: reduxStore, 
  registerActions: (actions)=>{
    actions.forEach((action)=>{
       actionsObj[action.type] = action;
    });
  },
  addAction: (action)=>{
    actionsObj[action.type] = action;
  }
}


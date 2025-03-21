import redux from "../redux-store.js"

export default class Action {

  constructor(type, reducer = (state, change)=>{return state}) {
    this.type = type;  //identifier for this Action
    //function to trigger this action with a change
    this.trigger = (change)=>{
      console.debug("Triggering "+this.type);
      redux.store.dispatch({type:this.type, change:change});
    };
    //the reducer for this action to return a new corresponding state 
    this.reducer = reducer;
   }
}

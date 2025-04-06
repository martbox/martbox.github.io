import Action from "./Action.js"
export default new Action("buttonClicked", (state, na)=>{
        const newState = Object.assign({}, state);
        newState.button.status = !state.button.status;
        return newState;
    });

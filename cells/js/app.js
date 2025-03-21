
import redux from "./redux-store.js";
import actions from "./actions/all.js";

redux.registerActions(actions);

const render = () => {
    ReactDOM.render(
        Root(redux.store.getState(), actions),
        document.getElementById('root')
    );
};

redux.store.subscribe(render);

console.debug("app loaded");


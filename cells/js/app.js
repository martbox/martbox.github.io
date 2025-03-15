
import redux from "./redux-store.js";
import actions from "./actions/all.js";
import views from "./react-views/all.js";

redux.registerActions(actions);

const render = () => {
    ReactDOM.render(
        views.Root(redux.store.getState(), actions),
        document.getElementById('root')
    );
};

redux.store.subscribe(render);


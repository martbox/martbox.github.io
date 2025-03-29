
//import {} from "https://unpkg.com/react@18.3.1/umd/react.production.min.js"
//import {createRoot} from "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"


import {} from "https://esm.sh/react@19.1.0/es2022/react.development.mjs";
import {} from "https://esm.sh/react-dom@19.1.0/es2022/react-dom.development.mjs";
//import * from "https://esm.sh/react-dom@19.1.0/es2022/client.development.mjs";
import ReactDOM from "https://esm.sh/react-dom@19.1.0/es2022/client.development.mjs";




//import React from "https://esm.sh/react@19/?dev"
//import ReactDOMClient from "https://esm.sh/react-dom@19/client?dev"

import redux from "./redux-store.js";
import actions from "./actions/all.js";

console.debug("ReactDOM is a "+typeof ReactDOM);
console.debug(Object.keys(ReactDOM));

redux.setActions(actions);

const reactDomRoot = ReactDOM.createRoot(document.getElementById('root'));

const renderRoot = () => {
    console.debug("Running myRender()");
    if(typeof window.Root === "function") {
       console.debug("rendering Root view");
      reactDomRoot.render(
        window.Root(redux.store.getState(), actions)
      );
    } else {
      console.error("Root view not found or not a function");
    }
};

redux.store.subscribe(renderRoot);
window.renderRoot = renderRoot;

console.debug("app loaded");


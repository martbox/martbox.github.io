
//import {} from "https://unpkg.com/react@18.3.1/umd/react.production.min.js"
//import {createRoot} from "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"

import React from "https://esm.sh/react@19/?dev"
import ReactDOMClient from "https://esm.sh/react-dom@19/client?dev"

import redux from "./redux-store.js";
import actions from "./actions/all.js";

redux.setActions(actions);

const root = ReactDOMClient.createRoot(document.getElementById('root'));

const myRender = () => {
    console.debug("Running myRender()");
    if(typeof Root === "function") {
       console.debug("rendering Root view");
      root.render(
        Root(redux.store.getState(), actions)
      );
    } else {
      console.error("Root view not found or not a function");
    }
};

redux.store.subscribe(myRender);

myRender();

console.debug("app loaded");


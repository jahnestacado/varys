import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App.jsx";
import SignUp from "./components/SignUp.jsx";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store.js";
import { BrowserRouter, Switch, Route } from "react-router-dom";

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
            <Switch>
                <Route exact path="/" component={App} />
                <Route exact path="/signup" component={SignUp} />
            </Switch>
        </BrowserRouter>
    </Provider>,
  document.getElementById("root"),
);

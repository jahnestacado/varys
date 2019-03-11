import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App.jsx";
import SignUp from "./components/SignUp.jsx";
import SignIn from "./components/SignIn.jsx";
import Config from "./components/Config.jsx";
import "semantic-ui-css/semantic.min.css";
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
                <Route exact path="/signin" component={SignIn} />
                <Route exact path="/config" component={Config} />
            </Switch>
        </BrowserRouter>
    </Provider>,
    document.getElementById("root")
);

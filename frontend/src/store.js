import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import entriesReducer from "./reducers/entriesReducer.js";
import notificationsReducer from "./reducers/notificationsReducer.js";
import authReducer from "./reducers/authReducer.js";
import thunk from "redux-thunk";

const composerEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
    combineReducers({
        entries: entriesReducer,
        auth: authReducer,
        notifications: notificationsReducer,
    }),
    composerEnhancer(applyMiddleware(thunk))
);

export default store;

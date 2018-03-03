import { createStore, combineReducers, applyMiddleware } from "redux";
import entriesReducer from "./reducers/entriesReducer.js";
import notificationsReducer from "./reducers/notificationsReducer.js";
import authReducer from "./reducers/authReducer.js";
import thunk from "redux-thunk";

const store = createStore(
    combineReducers({
        entries: entriesReducer,
        auth: authReducer,
        notifications: notificationsReducer,
    }),
    applyMiddleware(thunk)
);

export default store;

import { createStore, combineReducers, applyMiddleware } from "redux";
import entriesReducer from "./reducers/entriesReducer.js";
import notificationsReducer from "./reducers/notificationsReducer.js";
import authReducer from "./reducers/authReducer.js";

const store = createStore(
    combineReducers({
        results: entriesReducer,
        auth: authReducer,
        notifications: notificationsReducer,
    }),
    {}
);

export default store;

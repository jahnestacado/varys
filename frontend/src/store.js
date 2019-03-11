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
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    applyMiddleware(thunk)
);

export default store;

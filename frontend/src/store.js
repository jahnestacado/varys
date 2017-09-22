import { createStore, combineReducers, applyMiddleware } from "redux";
import entriesReducer from "./reducers/entriesReducer.js";
import authReducer from "./reducers/authReducer.js";
import searchQueryReducer from "./reducers/searchQueryReducer.js";

const store = createStore(
    combineReducers({
        results: entriesReducer,
        auth: authReducer,
        searchQuery: searchQueryReducer,
    }),
    {},
);

export default store;

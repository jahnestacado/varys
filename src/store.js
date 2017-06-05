import { createStore, combineReducers, applyMiddleware} from "redux";
import entriesReducer from "./reducers/entriesReducer.js";

const store = createStore(
    combineReducers(
        {
            results: entriesReducer,
        }
    ),
    {},
);

export default store;

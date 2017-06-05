import { UPDATE_ENTRY, DELETE_ENTRY, SET_ENTRIES} from "../utils/constants.js"

const defaultState = {
    entries: [],
};

const entriesReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case UPDATE_ENTRY:
            newState = {
                ...state,
                 entries: state.entries.map((entry) => {
                     let res = entry;
                     if(entry.id === action.payload.id) {
                         res = action.payload;
                     }
                     return res;
                 }),
             };
            break;
        case DELETE_ENTRY:
        newState = {
            ...state,
             entries: state.entries.filter((entry) => {
                 let shouldInclude = true;
                 if(entry.id === action.payload.id) {
                     shouldInclude = false;
                 }
                 return shouldInclude;
             }),
         };
            break;
        case SET_ENTRIES:
            newState = {entries: action.payload};
            break;
        default:
            newState = state;
    }

    return newState;
};

export default entriesReducer;

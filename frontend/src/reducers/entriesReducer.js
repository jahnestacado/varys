import {
    UPDATE_ENTRY,
    DELETE_ENTRY,
    SET_ENTRIES,
    SHOW_ENTRY,
    SHOW_ENTRY_EDITOR,
    SHOW_DELETE_ENTRY_MODAL,
    CLOSE_DELETE_ENTRY_MODAL,
} from "../utils/constants.js";

const defaultState = {
    entries: [],
    activeEntry: null,
    activeEntryEditor: null, // {type: null, entry: null},
    entryToDelete: null,
};

const entriesReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case UPDATE_ENTRY:
            newState = {
                ...state,
                entries: state.entries.map((entry) => {
                    let res = entry;
                    if (entry.id === action.payload.id) {
                        res = action.payload;
                    }
                    return res;
                }),
                activeEntryEditor: null,
            };
            break;
        case DELETE_ENTRY:
            newState = {
                ...state,
                entries: state.entries.filter((entry) => {
                    let shouldInclude = true;
                    if (entry.id === action.payload.id) {
                        shouldInclude = false;
                    }
                    return shouldInclude;
                }),
            };
            break;
        case SET_ENTRIES:
            newState = { ...state, entries: action.payload || [] };
            break;
        case SHOW_ENTRY:
            newState = { ...state, activeEntry: action.payload, activeEntryEditor: null };
            break;
        case SHOW_ENTRY_EDITOR:
            newState = { ...state, activeEntryEditor: action.payload, activeEntry: null };
            break;
        case SHOW_DELETE_ENTRY_MODAL:
            newState = { ...state, entryToDelete: action.payload };
            break;
        case CLOSE_DELETE_ENTRY_MODAL:
            newState = { ...state, entryToDelete: action.payload };
            break;
        default:
            newState = state;
    }

    return newState;
};

export default entriesReducer;

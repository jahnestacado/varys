import {
    UPDATE_ENTRY,
    DELETE_ENTRY,
    SET_ENTRIES,
    SHOW_ENTRY,
    SHOW_ENTRY_EDITOR,
    SHOW_DELETE_ENTRY_MODAL,
    CLOSE_DELETE_ENTRY_MODAL,
} from "../utils/constants.js";
import Http from "./../utils/http.js";

export const getEntries = (query) => {
    return (dispatch, getState) => {
        const url = `/api/v1/search?query=${query}`;
        const JWT = getState().auth.token;
        return Http.get(url, JWT)
            .then(({ payload }) => {
                dispatch(setEntries(payload));
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const setEntries = (entries) => ({
    type: SET_ENTRIES,
    payload: entries,
});

export const showEntry = (entry) => ({
    type: SHOW_ENTRY,
    payload: entry,
});

export const showDeleteEntryModal = (entry) => ({
    type: SHOW_DELETE_ENTRY_MODAL,
    payload: entry,
});

export const closeDeleteEntryModal = () => ({
    type: CLOSE_DELETE_ENTRY_MODAL,
    payload: null,
});

export const showEntryEditor = (entry) => ({
    type: SHOW_ENTRY_EDITOR,
    payload: entry,
});

export const updateOrCreateEntry = (entry) => {
    return (dispatch, getState) => {
        const url = "/api/v1/entry";
        const JWT = getState().auth.token;
        const updateAction = (entry) => ({
            type: UPDATE_ENTRY,
            payload: entry,
        });
        return Http.put(url, JWT, { body: JSON.stringify(entry) })
            .then(() => dispatch(updateAction(entry)))
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const deleteEntry = (entry) => {
    return (dispatch, getState) => {
        const url = `/api/v1/entry/${entry.id}`;
        const JWT = getState().auth.token;
        const deleteAction = (entry) => ({
            type: DELETE_ENTRY,
            payload: entry,
        });
        return Http.delete(url, JWT)
            .then(() => {
                dispatch(deleteAction(entry));
                dispatch(closeDeleteEntryModal());
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

import { ACCEPT_MERGE_REQUEST, REJECT_MERGE_REQUEST } from "../utils/constants.js";
import Http from "./../utils/http.js";
import { selectNotificationItem } from "./notificationsActions";

export const getMergeRequest = (selectedItem) => {
    return (dispatch, getState) => {
        const JWT = getState().auth.token;
        const mergeRequestUrl = `/api/v1/merge_request/${selectedItem.source_id}`;
        const mergeRequest = {};
        return Http.get(mergeRequestUrl, JWT)
            .then((modifiedEntry) => {
                mergeRequest.modifiedEntry = modifiedEntry;
                const entryUrl = `/api/v1/entry/${modifiedEntry.id}`;
                return Http.get(entryUrl, JWT);
            })
            .then((originalEntry) => {
                mergeRequest.originalEntry = originalEntry;
                const selectedItemWithData = Object.assign({}, selectedItem, {
                    data: mergeRequest,
                });
                dispatch(selectNotificationItem(selectedItemWithData));
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const acceptMergeRequest = (actionInfo) => {
    return (dispatch, getState) => {
        const JWT = getState().auth.token;
        const acceptMergeRequestAction = {
            type: ACCEPT_MERGE_REQUEST,
            payload: null,
        };
        const mergeRequestActionUrl = "/api/v1/merge_request/accept";
        return Http.post(mergeRequestActionUrl, JWT, {
            body: JSON.stringify(actionInfo),
        })
            .then(() => {
                dispatch(acceptMergeRequestAction);
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const rejectMergeRequest = (actionInfo) => {
    return (dispatch, getState) => {
        const JWT = getState().auth.token;
        const acceptMergeRequestAction = {
            type: REJECT_MERGE_REQUEST,
            payload: null,
        };
        const mergeRequestActionUrl = "/api/v1/merge_request/reject";
        return Http.post(mergeRequestActionUrl, JWT, {
            body: JSON.stringify(actionInfo),
        })
            .then(() => {
                dispatch(acceptMergeRequestAction);
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

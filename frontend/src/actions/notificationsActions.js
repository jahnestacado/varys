import { SELECT_NOTIFICATION_ITEM, SET_NOTIFICATION_ITEMS } from "../utils/constants.js";
import { showEntry } from "./entryActions";
import Http from "./../utils/http.js";

export const selectNotificationItem = (notificationItem) => {
    return {
        type: SELECT_NOTIFICATION_ITEM,
        payload: notificationItem,
    };
};

export const getNotifications = () => {
    return (dispatch, getState) => {
        const url = "/api/v1/notification";
        const JWT = getState().auth.token;
        return Http.get(url, JWT)
            .then((notifications) => {
                dispatch(setNotificationItems(notifications));
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const openNotification = (notification) => {
    return (dispatch, getState) => {
        const url = `/api/v1/entry/${notification.source_id}`;
        const JWT = getState().auth.token;
        return Http.get(url, JWT)
            .then((entry) => {
                dispatch(showEntry(entry));
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const deleteNotification = (notification) => {
    return (dispatch, getState) => {
        const url = `/api/v1/notification/${notification.id}`;
        const state = getState();
        const JWT = state.auth.token;
        const notificationEntries = state.notifications.entries;
        return Http.delete(url, JWT)
            .then(() => {
                const newNotificationEntries = notificationEntries.filter((n) => {
                    return n.id !== notification.id;
                });
                dispatch(setNotificationItems(newNotificationEntries));
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const setNotificationItems = (notificationItems) => {
    return {
        type: SET_NOTIFICATION_ITEMS,
        payload: notificationItems,
    };
};

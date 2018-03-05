import { SELECT_NOTIFICATION_ITEM, SET_NOTIFICATION_ITEMS } from "../utils/constants.js";
import Http from "./../utils/http.js";

export const selectNotificationItem = (notificationItem) => {
    return {
        type: SELECT_NOTIFICATION_ITEM,
        payload: notificationItem,
    };
};

export const getNotifications = () => {
    return (dispatch, getState) => {
        const url = "http://localhost:7676/api/v1/notification";
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

export const setNotificationItems = (notificationItems) => {
    return {
        type: SET_NOTIFICATION_ITEMS,
        payload: notificationItems,
    };
};

import { SELECT_NOTIFICATION_ITEM, SET_NOTIFICATION_ITEMS } from "../utils/constants.js";

export const selectNotificationItem = (notificationItem) => {
    return {
        type: SELECT_NOTIFICATION_ITEM,
        payload: notificationItem,
    };
};

export const setNotificationItems = (notificationItems) => {
    return {
        type: SET_NOTIFICATION_ITEMS,
        payload: notificationItems,
    };
};

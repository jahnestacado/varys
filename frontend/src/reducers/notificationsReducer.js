import { SELECT_NOTIFICATION_ITEM, SET_NOTIFICATION_ITEMS } from "../utils/constants.js";

const defaultState = {
    selectedNotificationItem: null,
    notificationItems: [],
};

const notificationsReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case SELECT_NOTIFICATION_ITEM:
            newState = {
                ...state,
                selectedNotificationItem: action.payload,
            };
            break;
        case SET_NOTIFICATION_ITEMS:
            newState = {
                ...state,
                notificationItems: action.payload,
            };
            break;
        default:
            newState = state;
    }

    return newState;
};

export default notificationsReducer;

import {
    SELECT_NOTIFICATION_ITEM,
    SET_NOTIFICATION_ITEMS,
    REJECT_MERGE_REQUEST,
    ACCEPT_MERGE_REQUEST,
} from "../utils/constants.js";

const defaultState = {
    selectedNotificationItem: null,
    notifications: [],
};

const notificationsReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case SELECT_NOTIFICATION_ITEM:
        case REJECT_MERGE_REQUEST:
        case ACCEPT_MERGE_REQUEST:
            newState = {
                ...state,
                selectedNotificationItem: action.payload,
            };
            break;
        case SET_NOTIFICATION_ITEMS:
            newState = {
                ...state,
                notifications: action.payload,
            };
            break;
        default:
            newState = state;
    }

    return newState;
};

export default notificationsReducer;

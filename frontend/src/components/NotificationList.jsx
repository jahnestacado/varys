import React, { Component } from "react";
import { List, Segment } from "semantic-ui-react";
import MergeRequestListItem from "./MergeRequestListItem.jsx";
import NotificationListItem from "./NotificationListItem.jsx";

import "./NotificationList.css";

const notificationListItemMap = {
    merge_request(notification) {
        return <MergeRequestListItem notification={notification} key={notification.id} />;
    },
    merge_request_accept(notification) {
        return <NotificationListItem notification={notification} key={notification.id} />;
    },
    merge_request_reject: (notification) =>
        notificationListItemMap.merge_request_accept(notification),
};

class NotificationList extends Component {
    render() {
        const self = this;
        const { props } = self;
        const { notifications } = props;
        return (
            <Segment className="NotificationList-segment" textAlign="left">
                <List divided verticalAlign="middle">
                    {notifications.map((notification) => {
                        const item = (notificationListItemMap[notification.type] ||
                            (({ type }) => {
                                console.warn(`Unknown notification type ${type}`);
                                return "";
                            }))(notification);

                        return item;
                    })}
                </List>
            </Segment>
        );
    }
}

export default NotificationList;

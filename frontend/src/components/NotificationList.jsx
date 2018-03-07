import React, { Component } from "react";
import "./NotificationList.css";
import { List, Segment } from "semantic-ui-react";
import MergeRequestListItem from "./MergeRequestListItem.jsx";
import NotificationListItem from "./NotificationListItem.jsx";
import { connect } from "react-redux";

class NotificationList extends Component {
    render() {
        const self = this;
        const { props } = self;
        const { notifications } = props;
        return (
            <Segment className="NotificationList-segment" textAlign="left">
                <List divided verticalAlign="middle">
                    {notifications.map((notification, i) => {
                        let item;
                        switch (notification.type) {
                            case "merge_request":
                                item = <MergeRequestListItem notification={notification} key={i} />;
                                break;
                            case "merge_request_accept":
                            case "merge_request_reject":
                                item = <NotificationListItem notification={notification} key={i} />;
                                break;
                        }
                        return item;
                    })}
                </List>
            </Segment>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        selectedNotificationItem: state.notifications.selectedNotificationItem,
    };
};

export default connect(mapStateToProps)(NotificationList);

import React, { Component } from "react";
import { Image, List, Button } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { deleteNotification, openNotification } from "./../actions/notificationsActions.js";

import "./NotificationListItem.css";

class NotificationListItem extends Component {
    constructor(props) {
        super(props);
        const self = this;
        bindToComponent(self, ["deleteNotification", "getHeader", "openNotification"]);
    }

    deleteNotification(event) {
        const self = this;
        const { props } = self;
        event.stopPropagation();
        props.dispatch(deleteNotification(props.notification));
    }

    openNotification() {
        const self = this;
        const { props } = self;
        props.dispatch(openNotification(props.notification));
    }

    getHeader() {
        const self = this;
        const { props } = self;
        const { type } = props.notification;
        let title = null;
        switch (type) {
            case "merge_request_accept":
                title = "Merge request accepted";
                break;
            case "merge_request_reject":
                title = "Merge request rejected";
                break;
            default:
                title = "Unknown";
                console.error(`Unknown notification type: ${type}`);
        }

        return title;
    }

    render() {
        const self = this;
        const { props, deleteNotification, getHeader, openNotification } = self;
        const { notification } = props;
        const header = getHeader();

        return (
            <List.Item
                className="NotificationListItem"
                id={notification.source_id}
                onClick={openNotification}
            >
                <Image
                    avatar
                    src="https://react.semantic-ui.com/assets/images/avatar/large/steve.jpg"
                />
                <List.Content>
                    <List.Header>{header}</List.Header>
                    <List.Description>
                        <b>{notification.description}</b>
                        {`  by ${notification.initiator}`}
                    </List.Description>
                </List.Content>
                <Button
                    className="NotificationListItem-close-btn"
                    onClick={deleteNotification}
                    circular
                    icon="close"
                />
            </List.Item>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        notificationEntries: state.notifications.entries,
    };
};

const mapDispatchToProps = (dispatch) => ({ dispatch });

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(NotificationListItem);

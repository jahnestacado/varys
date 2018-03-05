import React, { Component } from "react";
import { Image, List } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";
import MergeRequestModal from "./MergeRequestModal";
import { connect } from "react-redux";
import { selectNotificationItem } from "./../actions/notificationsActions.js";
import { getMergeRequest } from "./../actions/mergeRequestActions.js";
import "./MergeRequestListItem.css";

class MergeRequestListItem extends Component {
    constructor(props) {
        super(props);
        const self = this;
        bindToComponent(self, ["clearSelection", "getData"]);
    }

    getData() {
        const self = this;
        const { props } = self;
        props.getMergeRequest(props.notification);
    }

    clearSelection() {
        const self = this;
        const { props } = self;
        props.selectNotificationItem(null);
    }

    render() {
        const self = this;
        const { props, getData, clearSelection } = self;
        const { notification, selectedNotificationItem } = props;
        const shouldOpenModal =
            selectedNotificationItem &&
            selectedNotificationItem.id === notification.id &&
            selectedNotificationItem.data;

        return (
            <List.Item
                className="MergeRequestListItem"
                onClick={getData}
                id={notification.source_id}
            >
                <Image
                    avatar
                    src="https://react.semantic-ui.com/assets/images/avatar/large/steve.jpg"
                />
                <List.Content>
                    <List.Header>
                        <a>{`Merge Request #${notification.source_id}`}</a>
                    </List.Header>
                    <List.Description>
                        <b>{notification.description}</b>
                        {`  by ${notification.initiator}`}
                    </List.Description>
                </List.Content>
                {shouldOpenModal && (
                    <MergeRequestModal
                        selectedItem={selectedNotificationItem}
                        showModal
                        onClose={clearSelection}
                        onSubmit={clearSelection}
                        token={props.auth.token}
                    />
                )}
            </List.Item>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
        notificationItems: state.notifications.notificationItems,
        selectedNotificationItem: state.notifications.selectedNotificationItem,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        selectNotificationItem: (notificationItem) => {
            dispatch(selectNotificationItem(notificationItem));
        },
        getMergeRequest: (notificationItem) => dispatch(getMergeRequest(notificationItem)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(MergeRequestListItem);

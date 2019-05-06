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
        bindToComponent(self, ["clearSelection", "loadMergeRequestData"]);
    }

    loadMergeRequestData() {
        const self = this;
        const { props } = self;
        props.dispatch(getMergeRequest(props.notification));
    }

    clearSelection(event) {
        const self = this;
        const { props } = self;
        event.stopPropagation();
        // @TODO create explicit action to clear notification item
        props.dispatch(selectNotificationItem(null));
    }

    render() {
        const self = this;
        const { props, loadMergeRequestData, clearSelection } = self;
        const { notification, selectedNotificationItem } = props;
        const shouldOpenModal =
            selectedNotificationItem &&
            selectedNotificationItem.id === notification.id &&
            selectedNotificationItem.data;

        return (
            <List.Item
                className="MergeRequestListItem"
                onClick={loadMergeRequestData}
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
        notificationEntries: state.notifications.entries,
        selectedNotificationItem: state.notifications.selectedNotificationItem,
    };
};

const mapDispatchToProps = (dispatch) => ({ dispatch });

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MergeRequestListItem);

import React, { Component } from "react";
import { Image, List } from "semantic-ui-react";
import handleFetchError from "./../utils/handleFetchError.js";
import bindToComponent from "./../utils/bindToComponent.js";
import MergeRequestModal from "./MergeRequestModal";
import { connect } from "react-redux";
import { selectNotificationItem } from "./../actions/notificationsActions.js";
import { setNotificationItems } from "./../actions/notificationsActions.js";
import "./MergeRequestListItem.css";

class MergeRequestListItem extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            originalEntry: null,
            showModal: false,
        };
        bindToComponent(self, [
            "getOriginalEntry",
            "openModal",
            "closeModal",
            "resolveMergeRequest",
            "onNotificationItemSelection",
        ]);
    }

    getOriginalEntry(id, onDone) {
        const url = `http://localhost:7676/api/v1/entry/${id}`;
        fetch(url, {
            method: "GET",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
            }),
        })
            .then(handleFetchError)
            .then((response) => response.json())
            .then((json) => {
                onDone(json);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    openModal() {
        const self = this;
        self.setState({ showModal: true });
    }

    closeModal() {
        const self = this;
        self.setState({ showModal: false });
    }

    onNotificationItemSelection(event, data) {
        const self = this;
        const { props } = self;
        const selectedNotificationItem = props.notificationItems.find(
            (e) => e.merge_request_id === data.id
        );
        self.getOriginalEntry(selectedNotificationItem.id, (originalEntry) => {
            self.setState({ originalEntry });
            self.openModal();
        });
        props.selectNotificationItem(selectedNotificationItem);
    }

    resolveMergeRequest() {
        const self = this;
        const { props } = self;
        const { notificationItems, selectedNotificationItem } = props;
        props.setNotificationItems(
            notificationItems.filter(
                ({ merge_request_id }) =>
                    merge_request_id !== selectedNotificationItem.merge_request_id
            )
        );
        props.selectNotificationItem(null);
    }

    componentWillMount() {
        const self = this;
        const { state, props } = self;
        const { selectedNotificationItem } = props;
        const { originalEntry } = state;
        if (
            selectedNotificationItem &&
            originalEntry &&
            selectedNotificationItem.id === originalEntry.id
        ) {
            self.showModal();
        }
    }

    render() {
        const self = this;
        const { props, state, closeModal, onNotificationItemSelection, resolveMergeRequest } = self;
        const { originalEntry, showModal } = state;
        const { entry, selectedNotificationItem } = props;
        const shouldInstantiateModal =
            selectedNotificationItem &&
            originalEntry &&
            selectedNotificationItem.merge_request_id === entry.merge_request_id;

        return (
            <List.Item
                className="MergeRequestListItem"
                onClick={onNotificationItemSelection}
                id={entry.merge_request_id}
            >
                <Image
                    avatar
                    src="https://react.semantic-ui.com/assets/images/avatar/large/steve.jpg"
                />
                <List.Content>
                    <List.Header>Merge Request</List.Header>
                    <List.Description
                        content={`#${entry.merge_request_id} by ${entry.merge_request_author}`}
                    />
                </List.Content>
                {shouldInstantiateModal && (
                    <MergeRequestModal
                        modifiedEntry={selectedNotificationItem}
                        originalEntry={originalEntry}
                        showModal={showModal}
                        onClose={closeModal}
                        onSubmit={resolveMergeRequest}
                        token={self.props.auth.token}
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
        setNotificationItems: (notificationItems) => {
            dispatch(setNotificationItems(notificationItems));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(MergeRequestListItem);

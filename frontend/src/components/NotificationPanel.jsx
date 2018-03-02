import React, { Component } from "react";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { Icon, List, Image, Segment } from "semantic-ui-react";
import "./NotificationPanel.css";
import handleFetchError from "./../utils/handleFetchError.js";
// import MergeRequestModal from "./MergeRequestModal";
import NotificationList from "./NotificationList";
import { setNotificationItems } from "./../actions/notificationsActions.js";

import "./ResultListItem.css";

class NotificationPanel extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            showList: false,
        };
        bindToComponent(self, ["getMergeRequests", "toggleNotificationListState"]);
    }

    toggleNotificationListState(event, value = null) {
        const self = this;
        const showList = value !== null ? value : !self.state.showList;
        self.setState({
            showList,
        });
    }

    componentWillMount() {
        const self = this;
        self
            .getMergeRequests()
            .then((json) => {
                self.props.setNotificationItems(json);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    getMergeRequests() {
        const self = this;
        const url = "http://localhost:7676/api/v1/merge_request";
        return fetch(url, {
            method: "GET",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
                JWT: self.props.auth.token,
            }),
        })
            .then(handleFetchError)
            .then((response) => response.json());
    }

    render() {
        const self = this;
        const { state, props, onNotificationItemSelection, toggleNotificationListState } = self;
        const { showList } = state;
        const { notificationItems } = props;
        const showNotifications = !!notificationItems.length && showList;

        return (
            <div className="NotificationPanel">
                <Icon
                    name="alarm"
                    className="NotificationPanel-icon"
                    onClick={toggleNotificationListState}
                >
                    {notificationItems.length > 0 && (
                        <Icon name="comment" color="red" className="NotificationPanel-icon-message">
                            <span className="NotificationPanel-icon-counter">
                                {notificationItems.length}
                            </span>
                        </Icon>
                    )}
                </Icon>
                {showNotifications && (
                    <NotificationList
                        notificationItems={notificationItems}
                        onSelection={onNotificationItemSelection}
                    />
                )}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
        selectedNotificationItem: state.notifications.selectedNotificationItem,
        notificationItems: state.notifications.notificationItems,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        setNotificationItems: (notificationItems) => {
            dispatch(setNotificationItems(notificationItems));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(NotificationPanel);

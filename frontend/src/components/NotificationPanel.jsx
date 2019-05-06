import React, { Component } from "react";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { Icon } from "semantic-ui-react";
import "./NotificationPanel.css";
import NotificationList from "./NotificationList";
import { getNotifications } from "./../actions/notificationsActions.js";

import "./ResultListItem.css";

class NotificationPanel extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            showList: false,
        };
        bindToComponent(self, ["toggleNotificationListState"]);
    }

    toggleNotificationListState(event, value = null) {
        const self = this;
        const showList = value !== null ? value : !self.state.showList;
        self.setState({
            showList,
        });
    }

    componentDidMount() {
        const self = this;
        const { props } = self;
        props.dispatch(getNotifications());
    }

    shouldComponentUpdate(nextProps) {
        const self = this;
        const { props } = self;
        let shouldUpdate = true;
        if (nextProps.selectedNotificationItem === null && props.selectedNotificationItem) {
            shouldUpdate = false;
            props.dispatch(getNotifications());
        }
        return shouldUpdate;
    }

    render() {
        const self = this;
        const { state, props, toggleNotificationListState } = self;
        const { showList } = state;
        const { notificationEntries } = props;
        const showNotifications = !!notificationEntries.length && showList;
        return (
            <div className="NotificationPanel">
                <Icon
                    name="alarm"
                    className="NotificationPanel-icon"
                    onClick={toggleNotificationListState}
                >
                    {notificationEntries.length > 0 && (
                        <Icon name="comment" color="red" className="NotificationPanel-icon-message">
                            <span className="NotificationPanel-icon-counter">
                                {notificationEntries.length}
                            </span>
                        </Icon>
                    )}
                </Icon>
                {showNotifications && <NotificationList notifications={notificationEntries} />}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
        selectedNotificationItem: state.notifications.selectedNotificationItem,
        notificationEntries: state.notifications.entries,
    };
};

const mapDispatchToProps = (dispatch) => ({ dispatch });

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(NotificationPanel);

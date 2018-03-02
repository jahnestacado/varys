import React, { Component } from "react";
import "./NotificationList.css";
import { List, Segment } from "semantic-ui-react";
import MergeRequestListItem from "./MergeRequestListItem";

class NotificationList extends Component {
    render() {
        const self = this;
        const { props } = self;
        const { notificationItems, onSelection } = props;
        return (
            <Segment className="NotificationList-segment" textAlign="left">
                <List divided verticalAlign="middle">
                    {notificationItems.map((item, i) => {
                        return <MergeRequestListItem entry={item} key={i} onClick={onSelection} />;
                    })}
                </List>
            </Segment>
        );
    }
}

export default NotificationList;

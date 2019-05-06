import React, { Component } from "react";
import MarkdownViewer from "./MarkdownViewer.jsx";
import { connect } from "react-redux";
import { Modal, Header } from "semantic-ui-react";
import { closeEntry } from "./../actions/entryActions.js";

import "./ResultListItem.css";

class EntryModal extends Component {
    render() {
        const self = this;
        const { props } = self;
        const isOpen = !!props.activeEntry;
        const entry = props.activeEntry || {};
        return (
            <Modal
                open={isOpen}
                className="EntryForm-modal"
                closeIcon
                size="large"
                onClose={() => props.dispatch(closeEntry())}
            >
                {" "}
                <Header icon="file text outline" content={entry.title} />
                <Modal.Content scrolling>
                    <MarkdownViewer entry={entry} noTitle />
                </Modal.Content>
            </Modal>
        );
    }
}

const mapStateToProps = (state) => ({
    activeEntry: state.entries.activeEntry,
});

const mapDispatchToProps = (dispatch) => ({ dispatch });

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EntryModal);

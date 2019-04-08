import React, { Component } from "react";
import MarkdownViewer from "./MarkdownViewer.jsx";
import "./ResultListItem.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { Modal, Header } from "semantic-ui-react";
import { showEntry } from "./../actions/entryActions.js";

class EntryModal extends Component {
    constructor(props) {
        super(props);
        const self = this;
        bindToComponent(self, ["closeModal"]);
    }

    closeModal() {
        const self = this;
        self.props.showEntry(null);
    }

    render() {
        const self = this;
        const { closeModal, props } = self;
        const { activeEntry } = props;
        const entry = activeEntry || {};
        return (
            <Modal
                open={!!activeEntry}
                className="EntryForm-modal"
                closeIcon
                size="large"
                onClose={closeModal}
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

const mapStateToProps = (state) => {
    return {
        activeEntry: state.entries.activeEntry,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        showEntry: (entry) => dispatch(showEntry(entry)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(EntryModal);

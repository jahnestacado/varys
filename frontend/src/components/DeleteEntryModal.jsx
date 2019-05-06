import React, { Component } from "react";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { deleteEntry, closeDeleteEntryModal } from "./../actions/entryActions.js";
import { Icon, Modal, Button, Header } from "semantic-ui-react";

import "./DeleteEntryModal.css";

class DeleteEntryModal extends Component {
    constructor(props) {
        super(props);
        const self = this;
        bindToComponent(self, ["deleteEntry"]);
    }

    deleteEntry(event) {
        event.stopPropagation();
        const self = this;
        const { dispatch, entryToDelete } = self.props;
        dispatch(deleteEntry(entryToDelete));
    }

    render() {
        const self = this;
        const { props, deleteEntry } = self;
        const { title = "", id = "" } = props.entryToDelete || {};
        return (
            <div className="DeleteEntryModal">
                <Modal
                    open={!!props.entryToDelete}
                    onClose={() => props.dispatch(closeDeleteEntryModal())}
                    basic
                    size="small"
                    closeIcon
                >
                    <Header icon="browser" content={title} />
                    <Modal.Content>
                        <h3>Do you really want to delete entry #{id}?</h3>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color="red" onClick={deleteEntry} inverted>
                            <Icon name="eraser" /> Delete
                        </Button>
                    </Modal.Actions>
                </Modal>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    entryToDelete: state.entries.entryToDelete,
});

const mapDispatchToProps = (dispatch) => ({ dispatch });

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DeleteEntryModal);

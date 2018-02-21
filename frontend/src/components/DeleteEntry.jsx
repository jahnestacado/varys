import React, { Component } from "react";
import "./DeleteEntry.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { deleteEntry } from "./../actions/entryActions.js";
import handleFetchError from "./../utils/handleFetchError.js";
import { Icon, Modal, Button, Header } from "semantic-ui-react";

class DeleteEntry extends Component {
    constructor(props) {
        super(props);

        const self = this;
        self.state = {
            showModal: false,
        };
        bindToComponent(self, ["deleteEntry", "openModal", "closeModal"]);
    }

    deleteEntry(event) {
        event.stopPropagation();
        console.log("Ask for Confirmation!!!!!", this.props.entry);
        const self = this;
        const { entry, deleteEntry, auth } = self.props;
        const url = "http://localhost:7676/api/v1/entry";

        fetch(url, {
            method: "DELETE",
            body: JSON.stringify({ id: entry.id }),
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
                JWT: auth.token,
            }),
        })
            .then(handleFetchError)
            .then(() => {
                deleteEntry(entry);
            })
            .catch(console.log);
    }

    openModal() {
        console.log("SHOWW");
        const self = this;
        self.setState({
            showModal: true,
        });
    }

    closeModal() {
        console.log("SHOWW");
        const self = this;
        self.setState({
            showModal: false,
        });
    }

    render() {
        const self = this;
        const { state, props } = self;
        return (
            <div className="DeleteEntry">
                <Icon className="DeleteEntry-btn-delete" name="trash" onClick={self.openModal} />
                <Modal
                    open={state.showModal}
                    onClose={this.closeModal}
                    basic
                    size="small"
                    closeIcon
                >
                    <Header icon="browser" content={props.entry.title} />
                    <Modal.Content>
                        <h3>Do you really want to delete entry #{props.entry.id}?</h3>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button color="red" onClick={self.deleteEntry} inverted>
                            <Icon name="eraser" /> Delete
                        </Button>
                    </Modal.Actions>
                </Modal>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        deleteEntry: (entry) => {
            dispatch(deleteEntry(entry));
        },
    };
};

DeleteEntry.propTypes = {
    entry: React.PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(DeleteEntry);

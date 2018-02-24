import React, { Component } from "react";
import MarkdownEditor from "./MarkdownEditor.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import "./EntryForm.css";
import { connect } from "react-redux";
import { updateEntry } from "./../actions/entryActions.js";
import handleFetchError from "./../utils/handleFetchError.js";
import { Modal, Icon, Form, Input, Button, Label } from "semantic-ui-react";
import AutoCompleteDropdown from "./AutoCompleteDropdown";

const initializeEntry = ({ username }) => {
    return {
        title: "",
        body: "",
        tags: [],
        author: username,
        id: -1,
    };
};

class EntryForm extends Component {
    constructor(props) {
        super(props);
        const self = this;
        const entry = props.entry || initializeEntry(self.props.auth);
        this.state = {
            showModal: false,
            entry,
        };

        bindToComponent(self, [
            "openModal",
            "closeModal",
            "submit",
            "updateBody",
            "updateTitle",
            "setState",
            "updateTags",
        ]);
    }

    openModal(event) {
        const self = this;
        event && event.stopPropagation();
        self.setState({ showModal: true });
    }

    closeModal() {
        const self = this;
        self.setState({ showModal: false });
        self.tags = [];
    }

    submit() {
        const self = this;
        const { setState, closeModal, state } = self;
        const { type } = self.props;
        const url = "http://localhost:7676/api/v1/entry";
        fetch(url, {
            method: "PUT",
            body: JSON.stringify(state.entry),
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
                JWT: self.props.auth.token,
            }),
        })
            .then(handleFetchError)
            .then(() => {
                if (state.id !== -1) {
                    self.props.updateEntry(state.entry);
                }

                if (type === "add") {
                    setState({
                        entry: initializeEntry(self.props.auth),
                    });
                }
                closeModal();
            })
            .catch(console.log);
    }

    updateBody(body) {
        const self = this;
        self.setState({
            entry: { ...this.state.entry, body },
        });
    }

    updateTitle(event) {
        const self = this;
        const title = event.target.value;
        self.setState({
            entry: { ...self.state.entry, title },
        });
    }

    updateTags(tags) {
        const self = this;
        self.setState({
            entry: { ...self.state.entry, tags },
        });
    }

    render() {
        const self = this;
        const { openModal, closeModal, updateTitle, updateBody, submit, updateTags, state } = self;
        const { entry, showModal } = state;
        const { title, tags } = entry;
        return (
            <Form className="EntryForm">
                <div className="EntryForm-btn-open" onClick={openModal}>
                    <Icon name="add square" />
                </div>
                <Modal
                    open={showModal}
                    className="EntryForm-modal"
                    closeIcon
                    size="fullscreen"
                    onClose={closeModal}
                >
                    <Form>
                        <Form.Group className="EntryForm-header">
                            <Form.Field
                                placeholder="Set a title.."
                                control={Input}
                                onChange={updateTitle}
                                value={title}
                                className="EntryForm-title"
                            />
                        </Form.Group>
                    </Form>
                    <MarkdownEditor entry={entry} updateBody={updateBody} />
                    <Form.Group className="EntryForm-footer" widths="10">
                        <Button className="EntryForm-btn-submit" color="green" onClick={submit}>
                            Save
                        </Button>
                        <AutoCompleteDropdown
                            type="tag"
                            allowAdditions
                            upward
                            multiple
                            onSelectionChange={updateTags}
                            value={tags}
                            placeholder={"Select tag..."}
                        />
                    </Form.Group>
                </Modal>
            </Form>
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
        updateEntry: (entry) => {
            dispatch(updateEntry(entry));
        },
    };
};

EntryForm.propTypes = {
    entry: React.PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntryForm);

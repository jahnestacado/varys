import React, { Component } from "react";
import MarkdownEditor from "./MarkdownEditor.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import "./EntryForm.css";
import { connect } from "react-redux";
import { updateEntry } from "./../actions/entryActions.js";
import handleFetchError from "./../utils/handleFetchError.js";
import { Modal, Icon, Form, Input, Button } from "semantic-ui-react";
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
        const { type } = self.props;

        switch (type) {
            case "edit":
            case "add":
                self.submitEntry();
                break;
            case "merge-request":
                self.submitMergeRequest();
                break;
            default:
                console.log("Unknown type");
        }
    }

    submitEntry() {
        const self = this;
        const { setState, closeModal, state, props } = self;
        props.updateEntry(state.entry).then(() => {
            if (props.type === "add") {
                setState({
                    entry: initializeEntry(props.auth),
                });
            }
            closeModal();
        });
    }

    submitMergeRequest() {
        const self = this;
        const { closeModal, state, props } = self;
        const { auth } = self.props;
        const url = "http://localhost:7676/api/v1/merge_request";
        const mergeRequest = { ...state.entry, merge_request_author: auth.username };
        fetch(url, {
            method: "POST",
            body: JSON.stringify(mergeRequest),
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
                JWT: self.props.auth.token,
            }),
        })
            .then(handleFetchError)
            .then(() => {
                self.setState({ entry: props.entry });
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
        const {
            openModal,
            closeModal,
            updateTitle,
            updateBody,
            submit,
            updateTags,
            state,
            props,
        } = self;
        const { entry, showModal } = state;
        const { title, tags } = entry;
        const { color, circular, type, button, className } = props;
        const iconName = type === "merge-request" ? "fork" : "add";
        return (
            <div className="EntryForm">
                {button ? (
                    <Button
                        circular={circular}
                        color={color}
                        icon={iconName}
                        className={className}
                        onClick={openModal}
                        size="large"
                    />
                ) : (
                    <div className={className} onClick={openModal}>
                        <Icon name={iconName} />
                    </div>
                )}

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
                        <Button className="EntryForm-btn-submit" color="teal" onClick={submit}>
                            Submit
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
        updateEntry: (entry) => dispatch(updateEntry(entry)),
    };
};

EntryForm.propTypes = {
    entry: React.PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntryForm);

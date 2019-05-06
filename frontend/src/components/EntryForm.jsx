import React, { Component } from "react";
import MarkdownEditor from "./MarkdownEditor.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { updateOrCreateEntry, closeEntryEditor } from "./../actions/entryActions.js";
import { submitMergeRequest } from "./../actions/mergeRequestActions.js";
import { Modal, Form, Input, Button } from "semantic-ui-react";
import AutoCompleteDropdown from "./AutoCompleteDropdown";

import "./EntryForm.css";

class EntryForm extends Component {
    constructor(props) {
        super(props);
        const self = this;

        bindToComponent(self, [
            "submit",
            "updateBody",
            "updateTitle",
            "setState",
            "updateTags",
            "createDefaultEntry",
        ]);

        self.state = {
            entry: self.createDefaultEntry(),
        };
    }

    componentWillReceiveProps(nextProps) {
        const self = this;
        if (nextProps.activeEntryEditor && nextProps.activeEntryEditor.entry) {
            self.setState({ entry: nextProps.activeEntryEditor.entry });
        } else {
            self.setState({ entry: self.createDefaultEntry() });
        }
    }

    createDefaultEntry() {
        const self = this;
        const defaultEntry = {
            title: "",
            body: "",
            tags: [],
            author: self.props.auth.username,
            id: -1,
        };
        return defaultEntry;
    }

    submit() {
        const self = this;
        const { state, props } = self;
        const { type } = self.props.activeEntryEditor;

        switch (type) {
            case "edit":
            case "add":
                props.dispatch(updateOrCreateEntry(state.entry));
                break;
            case "merge-request": {
                const mergeRequest = { ...state.entry, merge_request_author: props.auth.username };
                props.dispatch(submitMergeRequest(mergeRequest));
                break;
            }
            default:
                console.log(`Unknown type: ${type}`);
        }
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
        const { updateTitle, updateBody, submit, updateTags, state, props } = self;
        const { entry } = state;
        const { title, tags } = entry;
        const showModal = !!props.activeEntryEditor;
        return (
            <div className="EntryForm">
                <Modal
                    open={showModal}
                    className="EntryForm-modal"
                    closeIcon
                    size="fullscreen"
                    onClose={() => props.dispatch(closeEntryEditor())}
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
        activeEntryEditor: state.entries.activeEntryEditor,
    };
};

const mapDispatchToProps = (dispatch) => ({ dispatch });

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EntryForm);

import React, { Component } from "react";
import { Modal, Header, Label, Button } from "semantic-ui-react";
import handleFetchError from "./../utils/handleFetchError.js";
import bindToComponent from "./../utils/bindToComponent.js";
import "./MergeRequestModal.css";

const RichDiff = require("react-rich-diff");
const MarkupIt = require("markup-it");
const markdown = require("markup-it/lib/markdown");
const MarkupItState = MarkupIt.State.create(markdown);

class MergeRequestModal extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            body: null,
        };
        const { originalEntry, modifiedEntry } = props;
        bindToComponent(self, ["submitEntry", "deleteMergeRequest"]);
        self.titleDiff = self.getMarkdownDiff(originalEntry.title, modifiedEntry.title);
        self.bodyDiff = self.getMarkdownDiff(originalEntry.body, modifiedEntry.body);
        self.tagDiff = self.getTagDiff(originalEntry, modifiedEntry);
    }

    closeModal() {
        const self = this;
        self.setState({ showModal: false });
    }

    getMarkdownDiff(original = "", modified = "") {
        const originalDoc = MarkupItState.deserializeToDocument(original);
        const modifiedDoc = MarkupItState.deserializeToDocument(modified);
        const diff = RichDiff.State.create(originalDoc, modifiedDoc);
        return diff;
    }

    getTagDiff(originalEntry = { tags: [] }, modifiedEntry = { tags: [] }) {
        const allUniqueTags = [...new Set(originalEntry.tags.concat(modifiedEntry.tags))];
        const tagDiff = allUniqueTags.map((tag) => {
            const tagLabelSpec = { name: tag, className: "MergeRequestModal-label" };
            if (!modifiedEntry.tags.includes(tag)) {
                tagLabelSpec.className = "MergeRequestModal-deleted-label";
            } else if (!originalEntry.tags.includes(tag)) {
                tagLabelSpec.className = "MergeRequestModal-new-label";
            }

            return tagLabelSpec;
        });
        return tagDiff;
    }

    submitEntry() {
        const self = this;
        const { props } = self;
        const { modifiedEntry, onSubmit } = props;
        const url = "http://localhost:7676/api/v1/entry";
        fetch(url, {
            method: "PUT",
            body: JSON.stringify(modifiedEntry),
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
                JWT: self.props.token,
            }),
        })
            .then(handleFetchError)
            .then(() => {
                self.deleteMergeRequest(() => {
                    onSubmit();
                });
            })
            .catch(console.log);
    }

    deleteMergeRequest(onDone, onError) {
        const self = this;
        const { props } = self;
        const { modifiedEntry } = props;
        const url = `http://localhost:7676/api/v1/merge_request/${modifiedEntry.merge_request_id}`;
        fetch(url, {
            method: "DELETE",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
                JWT: self.props.token,
            }),
        })
            .then(handleFetchError)
            .then(onDone)
            .catch(onError);
    }

    render() {
        const self = this;
        const { props, titleDiff, bodyDiff, tagDiff, submitEntry } = self;
        const { showModal, onClose } = props;

        return (
            <Modal
                className="MergeRequestModal"
                open={showModal}
                closeIcon
                size="large"
                onClose={onClose}
            >
                {" "}
                <Header icon="file text outline" content={<RichDiff state={titleDiff} />} />
                <Modal.Content scrolling>
                    {bodyDiff && <RichDiff state={bodyDiff} />}
                    <div className="MergeRequestModal-footer">
                        <div className="MergeRequestModal-tags">
                            {tagDiff.map(({ name, className }, i) => (
                                <Label className={className} key={i} tag>
                                    {name}
                                </Label>
                            ))}
                        </div>
                        <Button.Group className="MergeRequestModal-btn-group">
                            <Button negative onClick={submitEntry}>
                                Reject
                            </Button>
                            <Button.Or />
                            <Button color="teal" onClick={submitEntry}>
                                Merge
                            </Button>
                        </Button.Group>
                    </div>
                </Modal.Content>
            </Modal>
        );
    }
}

export default MergeRequestModal;
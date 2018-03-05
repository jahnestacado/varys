import React, { Component } from "react";
import { Modal, Header, Label, Button, Dimmer, Loader } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { rejectMergeRequest, acceptMergeRequest } from "./../actions/mergeRequestActions.js";
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
        bindToComponent(self, ["acceptMergeRequest", "rejectMergeRequest"]);
        const { selectedItem } = props;
        const { originalEntry, modifiedEntry } = selectedItem.data;
        self.titleDiff = self.getMarkdownDiff(originalEntry.title, modifiedEntry.title);
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

    acceptMergeRequest() {
        const self = this;
        const { props } = self;
        const { selectedItem } = props;
        const { id, source_id } = selectedItem;
        return props.acceptMergeRequest({ notification_id: id, merge_request_id: source_id });
    }

    rejectMergeRequest() {
        const self = this;
        const { props } = self;
        const { selectedItem } = props;
        const { id, source_id } = selectedItem;
        return props.rejectMergeRequest({ notification_id: id, merge_request_id: source_id });
    }

    componentDidMount() {
        const self = this;
        if (self.state.body === null) {
            const { selectedItem } = self.props;
            const { originalEntry, modifiedEntry } = selectedItem.data;
            setTimeout(() => {
                const bodyDiff = self.getMarkdownDiff(originalEntry.body, modifiedEntry.body);
                self.setState({
                    body: bodyDiff,
                });
            }, 0);
        }
    }

    render() {
        const self = this;
        const { props, state, titleDiff, tagDiff, acceptMergeRequest, rejectMergeRequest } = self;
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
                    {state.body ? (
                        <RichDiff state={state.body} />
                    ) : (
                        <div className="dimmer">
                            <Dimmer active>
                                <Loader size="large">Computing diff...</Loader>
                            </Dimmer>
                        </div>
                    )}
                    <div className="MergeRequestModal-footer">
                        <div className="MergeRequestModal-tags">
                            {tagDiff.map(({ name, className }, i) => (
                                <Label className={className} size="large" key={i}>
                                    {name}
                                </Label>
                            ))}
                        </div>
                        <Button.Group className="MergeRequestModal-btn-group">
                            <Button negative onClick={rejectMergeRequest}>
                                Reject
                            </Button>
                            <Button color="teal" onClick={acceptMergeRequest}>
                                Merge
                            </Button>
                        </Button.Group>
                    </div>
                </Modal.Content>
            </Modal>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        rejectMergeRequest: (id) => dispatch(rejectMergeRequest(id)),
        acceptMergeRequest: (modifiedEntry) => dispatch(acceptMergeRequest(modifiedEntry)),
    };
};

export default connect(null, mapDispatchToProps)(MergeRequestModal);

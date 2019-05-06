import React, { Component } from "react";
import { Modal, Header, Icon, Label, Button, Dimmer, Loader } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { rejectMergeRequest, acceptMergeRequest } from "./../actions/mergeRequestActions.js";
import DiffMatchPatch from "diff-match-patch";

import "./MergeRequestModal.css";

DiffMatchPatch.DIFF_DELETE = -1;
DiffMatchPatch.DIFF_INSERT = 1;
DiffMatchPatch.DIFF_EQUAL = 0;

class MergeRequestModal extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.diffMatchPatch = new DiffMatchPatch();
        self.state = {
            body: null,
        };
        bindToComponent(self, ["acceptMergeRequest", "rejectMergeRequest"]);
        const { selectedItem } = props;
        const { originalEntry, modifiedEntry } = selectedItem.data;
        // We calculate initial diff only for title and tags cause this happens instantly
        // The body diff might take more time so we skip a tick to show a spinner
        // Idealy this diffing should be done in the backend
        self.titleDiff = self.getMarkdownDiff(originalEntry.title, modifiedEntry.title);
        self.tagDiff = self.getTagDiff(originalEntry, modifiedEntry);
    }

    closeModal() {
        const self = this;
        self.setState({ showModal: false });
    }

    getMarkdownDiff(original = "", modified = "") {
        const self = this;
        const mainDiff = self.diffMatchPatch.diff_main(original, modified);
        const htmlDiff = self.diffMatchPatch.diff_prettyHtml(mainDiff).replace(/&para;/g, "");
        return htmlDiff;
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
                <Header>
                    <Icon name="file text outline" />
                    <div dangerouslySetInnerHTML={{ __html: titleDiff }} />
                </Header>
                <Modal.Content scrolling>
                    {state.body ? (
                        <div dangerouslySetInnerHTML={{ __html: state.body }} />
                    ) : (
                        <div className="dimmer">
                            <Dimmer active>
                                <Loader size="large">Computing diff...</Loader>
                            </Dimmer>
                        </div>
                    )}
                    <div className="MergeRequestModal-footer">
                        <div className="MergeRequestModal-tags">
                            {tagDiff.map(({ name, className }) => (
                                <Label className={className} size="large" key={name}>
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

export default connect(
    null,
    mapDispatchToProps
)(MergeRequestModal);

import React, { Component } from "react";
import ReactModal from "react-modal";
import MarkdownViewer from "./MarkdownViewer.jsx";
import EntryForm from "./EntryForm.jsx";
import DeleteEntry from "./DeleteEntry.jsx";
import "./ResultListItem.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { Card, Label } from "semantic-ui-react";

class ResultListItem extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            showModal: false,
            entry: props.entry,
        };
        bindToComponent(self, ["openModal", "closeModal"]);
    }

    openModal() {
        this.setState({ showModal: true });
    }

    closeModal() {
        this.setState({ showModal: false });
    }

    render() {
        const self = this;
        const { openModal, closeModal } = self;
        const { entry } = self.state;
        const keywordLabels = entry.tags.map((keyword, i) => {
            return (
                <Label
                    key={i}
                    color="teal"
                    size="tiny"
                    className="ResultListItem-label"
                >
                    {keyword}
                </Label>
            );
        });

        return (
            <Card className="ResultListItem" fluid centered onClick={openModal}>
                <Card.Content>
                    <Card.Meta>
                        <div className="ResultListItem-btn-panel">
                            <EntryForm entry={self.props.entry} />
                            <DeleteEntry entry={self.props.entry} />
                        </div>
                    </Card.Meta>
                    <Card.Header className="ResultListItem-title">
                        {self.props.entry.title}
                    </Card.Header>
                    <Card.Description className="ResultListItem-description">
                        {`${entry.body.substring(0, 140)}...`}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra className="ResultListItem-label-panel">
                    {keywordLabels}
                </Card.Content>
                <ReactModal
                    isOpen={this.state.showModal}
                    contentLabel={entry.title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={closeModal}
                >
                    <MarkdownViewer entry={self.props.entry} />

                    <button
                        className="ResultListItem-btn-close"
                        onClick={closeModal}
                    >
                        x
                    </button>
                </ReactModal>
            </Card>
        );
    }
}

ResultListItem.propTypes = {
    entry: React.PropTypes.object.isRequired,
};

export default ResultListItem;

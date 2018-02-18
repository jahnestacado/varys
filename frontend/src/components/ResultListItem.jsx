import React, { Component } from "react";
import ReactModal from "react-modal";
import MarkdownViewer from "./MarkdownViewer.jsx";
import EntryForm from "./EntryForm.jsx";
import DeleteEntry from "./DeleteEntry.jsx";
import "./ResultListItem.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { Card, Image, Dropdown } from "semantic-ui-react";

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

        return (
            <Card className="ResultListItem" fluid centered onClick={openModal}>
                <Card.Content>
                    <Card.Meta>
                        <Dropdown
                            className="ResultListItem-btn-panel"
                            item
                            icon="ellipsis vertical"
                        >
                            <Dropdown.Menu>
                                <EntryForm entry={self.props.entry} />
                                <DeleteEntry entry={self.props.entry} />
                            </Dropdown.Menu>
                        </Dropdown>
                    </Card.Meta>
                    <Card.Header className="ResultListItem-title" title={self.props.entry.title}>
                        {self.props.entry.title}
                    </Card.Header>
                    <Image
                        className="ResultListItem-avatar"
                        bordered
                        rounded
                        floated="right"
                        size="mini"
                        src="https://react.semantic-ui.com/assets/images/avatar/large/steve.jpg"
                    />
                </Card.Content>
                <ReactModal
                    isOpen={this.state.showModal}
                    contentLabel={entry.title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={closeModal}
                >
                    <MarkdownViewer entry={self.props.entry} />

                    <button className="ResultListItem-btn-close" onClick={closeModal}>
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

import React, { Component } from "react";
import MarkdownViewer from "./MarkdownViewer.jsx";
import EntryForm from "./EntryForm.jsx";
import DeleteEntry from "./DeleteEntry.jsx";
import "./ResultListItem.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { Card, Image, Label, Dropdown, Modal, Header } from "semantic-ui-react";

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
        const { openModal, closeModal, state, props } = self;
        const { entry, auth } = props;
        const { username } = auth;
        const isEntryAuthor = entry.author === username;
        const keywordLabels = entry.tags.map((keyword, i) => {
            return (
                <Label key={i} color="teal" size="mini" className="ResultListItem-label">
                    {keyword}
                </Label>
            );
        });
        return (
            <Card className="ResultListItem" onClick={openModal}>
                <Card.Content>
                    <Card.Header className="ResultListItem-id">
                        {`#${entry.id}`}
                        {username && (
                            <Card.Meta className="ResultListItem-actions">
                                {isEntryAuthor ? (
                                    <Dropdown
                                        className="ResultListItem-action"
                                        item
                                        icon="ellipsis vertical"
                                    >
                                        <Dropdown.Menu>
                                            <EntryForm entry={entry} type="edit" />
                                            <DeleteEntry entry={entry} />
                                        </Dropdown.Menu>
                                    </Dropdown>
                                ) : (
                                    <EntryForm
                                        className="ResultListItem-fork-btn"
                                        entry={entry}
                                        type="merge-request"
                                    />
                                )}
                            </Card.Meta>
                        )}
                        <Image
                            className="ResultListItem-avatar"
                            bordered
                            rounded
                            title={entry.author}
                            floated="right"
                            size="mini"
                            src="https://react.semantic-ui.com/assets/images/avatar/large/steve.jpg"
                        />
                    </Card.Header>
                    <Card.Description title={entry.title} className="ResultListItem-description">
                        {entry.title}
                    </Card.Description>
                    <Card.Content extra className="ResultListItem-label-panel">
                        {keywordLabels}
                    </Card.Content>
                </Card.Content>

                <Modal
                    open={state.showModal}
                    className="EntryForm-modal"
                    closeIcon
                    size="large"
                    onClose={closeModal}
                >
                    {" "}
                    <Header icon="file text outline" content={entry.title} />
                    <Modal.Content scrolling>
                        <MarkdownViewer entry={entry} noTitle />
                    </Modal.Content>
                </Modal>
            </Card>
        );
    }
}

ResultListItem.propTypes = {
    entry: React.PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
    };
};

export default connect(mapStateToProps)(ResultListItem);

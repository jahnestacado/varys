import React, { Component } from "react";
import { Col, ListGroupItem, Label } from "react-bootstrap";
import ReactModal from "react-modal";
import MarkdownViewer from "./MarkdownViewer.jsx";
import EntryForm from "./EntryForm.jsx";
import DeleteEntry from "./DeleteEntry.jsx";
import "./ResultListItem.css";
import bindToComponent from "./../utils/bindToComponent.js";

class ResultListItem extends Component {
    constructor(props){
        super(props);
        const self = this;
        self.state = {
            showModal: false,
            entry: props.entry,
        };
        bindToComponent(self, [
            "openModal",
            "closeModal",
        ]);
    }

    openModal(){
        this.setState({showModal: true});
    }

    closeModal(){
        this.setState({showModal: false});
    }

    render() {
        const self = this;
        const { openModal, closeModal } = self;
        const { entry } = self.state;
        const keywordLabels = entry.tags.map((keyword, i) => {
            return (
                <Label key={i} className="ResultListItem-label">{keyword}</Label>
            );
        });
        return (
            <Col sm={6} md={4} >
                <ListGroupItem
                    className="ResultListItem"
                    onClick={openModal}
                >
                    <div className="ResultListItem-btn-panel">
                        <EntryForm entry={self.props.entry} />
                        <DeleteEntry entry={self.props.entry} />
                    </div>
                    <div className="ResultListItem-title">{self.props.entry.title}</div>
                    <div>{keywordLabels}</div>
                </ListGroupItem>
                <ReactModal
                    isOpen={this.state.showModal}
                    contentLabel={entry.title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={closeModal}
                >
                    <MarkdownViewer entry={self.props.entry} />

                    <button className="ResultListItem-btn-close" onClick={closeModal}>x</button>
                </ReactModal>
            </Col>
        );
    }
}

ResultListItem.propTypes = {
    entry: React.PropTypes.object.isRequired,
};

export default ResultListItem;

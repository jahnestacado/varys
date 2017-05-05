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
            // put entry as state????
        };
        bindToComponent(self, [
            "updateEntry",
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

    updateEntry(entry){
        const self = this;
        self.setState({entry});
    }

    render() {
        const self = this;
        const { openModal, closeModal, updateEntry } = self;
        const { entry } = self.state;
		const { onEntryDeleted } = self.props;
        const keywordLabels = entry.keywords.map((keyword, i) => {
            return (
                <Label key={i} className="ResultListItem-label">{keyword}</Label>
            )
        })
        return (
            <Col sm={6} md={4} >
                <ListGroupItem
                    className="ResultListItem"
                    onClick={openModal}
                >
				<div className="ResultListItem-btn-panel">
					<EntryForm onEntryUpdated={updateEntry} entry={entry} />
					<DeleteEntry onEntryDeleted={onEntryDeleted} entry={entry} />
				</div>
                <div className="ResultListItem-title">{entry.title}</div>
                <div>{keywordLabels}</div>
                </ListGroupItem>
                <ReactModal
                    isOpen={this.state.showModal}
                    contentLabel={entry.title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={closeModal}
                >
                    <MarkdownViewer entry={entry} />

                    <button className="ResultListItem-btn-close" onClick={closeModal}>x</button>
                </ReactModal>
            </Col>
        )
    }
}

ResultListItem.propTypes = {
    entry: React.PropTypes.object.isRequired,
	onEntryDeleted: React.PropTypes.func.isRequired,
};

export default ResultListItem;

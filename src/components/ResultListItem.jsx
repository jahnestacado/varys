import React, { Component } from "react";
import { Col, ListGroupItem, Label } from "react-bootstrap";
import ReactModal from "react-modal";
import MarkdownViewer from "./MarkdownViewer.jsx";
import EntryForm from "./EntryForm.jsx";
import "./ResultListItem.css";

class ResultListItem extends Component {
    constructor(props){
        super(props);
        this.state = {
            showModal: false,
        };
    }

    openModal(){
        this.setState({showModal: true});
    }

    closeModal(){
        this.setState({showModal: false});
    }

    render() {
        const { entry } = this.props;
        const keywordLabels = entry.keywords.map((keyword, i) => {
            return (
                <Label key={i} className="ResultListItem-label">{keyword}</Label>
            )
        })
        return (
            <Col sm={6} md={4} >
                <ListGroupItem
                    className="ResultListItem"
                    onClick={() => this.openModal()}
                >
                <div className="ResultListItem-title">{entry.title}</div>
                <div>{keywordLabels}</div>
                <EntryForm entry={entry} />
                </ListGroupItem>
                <ReactModal
                    isOpen={this.state.showModal}
                    contentLabel={entry.title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={() => this.closeModal()}
                >
                    <MarkdownViewer entry={entry} />

                    <button className="ResultListItem-btn-close" onClick={() => this.closeModal()}>x</button>
                </ReactModal>
            </Col>
        )
    }
}

ResultListItem.propTypes = {
    entry: React.PropTypes.object.isRequired,
};


export default ResultListItem;

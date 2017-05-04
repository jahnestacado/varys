import React, { Component } from "react";
import { Col, ListGroupItem } from "react-bootstrap";
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
        return (
            <Col sm={6} md={4} >
                <ListGroupItem
                    className="ResultListItem"
                    onClick={() => this.openModal()}
                >
                {entry.title}
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

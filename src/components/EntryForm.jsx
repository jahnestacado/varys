import React, { Component } from "react";
import ReactModal from "react-modal";
import MarkdownEditor from "./MarkdownEditor.jsx"
import { Button, Glyphicon } from "react-bootstrap";
import "./EntryForm.css";

const createEntry = () => {
    return {
        title: "",
        keywords: [],
        markdown: "",
        // username
        // date-created
        // date-edited
    }
};

class EntryForm extends Component {
    constructor(props){
        super(props);
        const entry = props.entry || createEntry();
        this.state = {
            showModal: false,
            entry,
            glyph: props.entry ? "pencil" : "plus-sign",
        };

        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.save = this.save.bind(this);
        this.updateKeywords = this.updateKeywords.bind(this);
        this.updateMarkdown = this.updateMarkdown.bind(this);
        this.updateTitle = this.updateTitle.bind(this);
    }

    openModal(event){
        event.stopPropagation();
        this.setState({showModal: true});
    }

    closeModal(){
        this.setState({showModal: false});
    }

    save(){
        console.log("Saving", this.state.entry);
        const url = "http://localhost:7676/entry";
            fetch(url, {
                method: "PUT",
                webPreferences: {
                    webSecurity: false
                },
                body: JSON.stringify(this.state.entry),
                headers: new Headers({
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }),
            })
            .then(() => {
                this.setState({
                    markdown: "",
                    title: "",
                    keywords: "",
                });
                this.closeModal();
            })
            .catch(console.log);

    }

    updateMarkdown(markdown){
        this.setState({
            entry: {...this.state.entry, markdown},
        });
    }

    updateTitle(event){
        const title = event.target.value;
        this.setState({
            entry: {...this.state.entry, title},
        });
    }

    updateKeywords(event){
        const keywordsText = event.target.value;
        const keywords = keywordsText.split(",").map((keyword) => keyword.trim());
        this.setState({
            entry: {...this.state.entry, keywords},
        });
    }

    render() {
        const { entry, showModal, glyph } = this.state;
        const { title, keywords } = entry;
        return (
            <div className="EntryForm">
                <div className="EntryForm-btn-open" onClick={this.openModal} >
                    <Glyphicon glyph={glyph}></Glyphicon>
                </div>
                <ReactModal
                    isOpen={showModal}
                    contentLabel={title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={this.closeModal}
                >
                    <div className="EntryForm-title">
                        <div>Title</div>
                        <input value={title} onChange={this.updateTitle} />
                    </div>
                    <MarkdownEditor entry={entry} updateMarkdown={this.updateMarkdown}/>
                    <Button className="EntryForm-btn-close" onClick={this.closeModal} >
                        x
                    </Button>
                    <Button className="EntryForm-btn-save btn btn-success" onClick={this.save} >
                        Save
                    </Button>
                    <div className="EntryForm-keywords">
                        <div>Keywords</div>
                        <input value={keywords} onChange={this.updateKeywords} />
                    </div>
                </ReactModal>
            </div>
        )
    }
}

export default EntryForm;

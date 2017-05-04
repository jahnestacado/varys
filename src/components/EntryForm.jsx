import React, { Component } from "react";
import ReactModal from "react-modal";
import MarkdownEditor from "./MarkdownEditor.jsx"
import { Button, Glyphicon } from "react-bootstrap";
import bindToComponent from "./../utils/bindToComponent.js";
import "./EntryForm.css";

const initializeEntry = () => {
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
        const self = this;
        const entry = props.entry || initializeEntry();
        this.state = {
            showModal: false,
            entry,
            glyph: props.entry ? "pencil" : "plus-sign",
        };

        bindToComponent(self, [
            "openModal",
            "closeModal",
            "submit",
            "updateKeywords",
            "updateMarkdown",
            "updateTitle",
            "setState"
        ]);
    }

    openModal(event){
        const self = this;
        event && event.stopPropagation();
        this.setState({showModal: true});
    }

    closeModal(event){
        const self = this;
        event && event.stopPropagation();
        self.setState({showModal: false});
    }

    submit(){
        const self = this;
        const { setState, closeModal, state } = self;
        console.log("Saving", state.entry);
        const url = "http://localhost:7676/entry";
            fetch(url, {
                method: "PUT",
                webPreferences: {
                    webSecurity: false
                },
                body: JSON.stringify(state.entry),
                headers: new Headers({
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }),
            })
            .then(() => {
                setState({
                    markdown: "",
                    title: "",
                    keywords: "",
                });
                closeModal();
            })
            .catch(console.log);

    }

    updateMarkdown(markdown){
        const self = this;
        self.setState({
            entry: {...this.state.entry, markdown},
        });
    }

    updateTitle(event){
        const self = this;
        const title = event.target.value;
        self.setState({
            entry: {...self.state.entry, title},
        });
    }

    updateKeywords(event){
        const self = this;
        const keywordsText = event.target.value;
        const keywords = keywordsText.split(",").map((keyword) => keyword.trim());
        self.setState({
            entry: {...self.state.entry, keywords},
        });
    }

    render() {
        const self = this;
        const {
            openModal,
            closeModal,
            updateTitle,
            updateMarkdown,
            updateKeywords,
            submit,
        } = self;
        const { entry, showModal, glyph } = this.state;
        const { title, keywords } = entry;
        console.log("Updated tityle", title, self.state.entry.title);
        return (
            <div className="EntryForm">
                <div className="EntryForm-btn-open" onClick={openModal} >
                    <Glyphicon glyph={glyph}></Glyphicon>
                </div>
                <ReactModal
                    isOpen={showModal}
                    contentLabel={title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={closeModal}
                >
                    <div className="EntryForm-title">
                        <div>Title</div>
                        <input value={title} onChange={updateTitle} />
                    </div>
                    <MarkdownEditor entry={entry} updateMarkdown={updateMarkdown}/>
                    <Button className="EntryForm-btn-close" onClick={closeModal} >
                        x
                    </Button>
                    <Button className="EntryForm-btn-submit btn btn-success" onClick={submit} >
                        Save
                    </Button>
                    <div className="EntryForm-keywords">
                        <div>Keywords</div>
                        <input value={keywords} onChange={updateKeywords} />
                    </div>
                </ReactModal>
            </div>
        )
    }
}

export default EntryForm;

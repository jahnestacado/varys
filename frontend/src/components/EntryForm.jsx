import React, { Component } from "react";
import ReactModal from "react-modal";
import MarkdownEditor from "./MarkdownEditor.jsx";
import { Button, Glyphicon, ControlLabel, FormControl, FormGroup, Form } from "react-bootstrap";
import bindToComponent from "./../utils/bindToComponent.js";
import "./EntryForm.css";
import { connect } from "react-redux";
import { updateEntry } from "./../actions/entryActions.js";
import handleFetchError from "./../utils/handleFetchError.js";

const initializeEntry = ({ username }) => {
    return {
        title: "",
        body: "",
        tags: [],
        author: username,
        id: -1,
    };
};

class EntryForm extends Component {
    constructor(props){
        super(props);
        const self = this;
        const entry = props.entry || initializeEntry(self.props.auth);
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
            "updateBody",
            "updateTitle",
            "setState",
        ]);
    }

    openModal(event){
        const self = this;
        event && event.stopPropagation();
        self.setState({showModal: true});
    }

    closeModal(event){
        const self = this;
        event && event.stopPropagation();
        self.setState({showModal: false});
    }

    submit(){
        const self = this;
        const { setState, closeModal, state } = self;
        const url = "http://localhost:7676/api/v1/entry";
        fetch(url, {
            method: "PUT",
            body: JSON.stringify(state.entry),
            headers: new Headers({
                "Accept": "application/json",
                "Content-Type": "application/json",
                "JWT": self.props.auth.token,
            }),
        })
        .then(handleFetchError)
        .then(() => {
            if (state.id  !== -1) {
                self.props.updateEntry(state.entry);
            }
            setState({
                entry: initializeEntry(self.props.auth),
            });
            closeModal();
        })
        .catch(console.log);
    }

    updateBody(body){
        const self = this;
        self.setState({
            entry: {...this.state.entry, body},
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
        const tagsText = event.target.value;
        const tags = tagsText.split(",").map((keyword) => keyword.trim());
        self.setState({
            entry: {...self.state.entry, tags},
        });
    }

    render() {
        const self = this;
        const {
            openModal,
            closeModal,
            updateTitle,
            updateBody,
            updateKeywords,
            submit,
        } = self;
        const { entry, showModal, glyph } = this.state;
        const { title, tags } = entry;
        return (
            <Form className="EntryForm">
                <div className="EntryForm-btn-open" onClick={openModal} >
                    <Glyphicon glyph={glyph}></Glyphicon>
                </div>
                <ReactModal
                    isOpen={showModal}
                    contentLabel={title}
                    shouldCloseOnOverlayClick={true}
                    onRequestClose={closeModal}
                >
                    <Form className="EntryForm-title" inline>
                        <FormGroup controlId="formInlineName">
                        <ControlLabel>Title</ControlLabel>
                        {" "}
                        <FormControl placeholder="Set a title.." value={title} onChange={updateTitle} />
                        </FormGroup>
                    </Form>
                    <MarkdownEditor entry={entry} updateBody={updateBody}/>
                    <Button className="EntryForm-btn-close" onClick={closeModal} >
                        x
                    </Button>
                    <Button className="EntryForm-btn-submit btn btn-success" onClick={submit} >
                        Save
                    </Button>
                    <Form className="EntryForm-tags" inline>
                        <FormGroup controlId="formInlineName">
                        <ControlLabel>Keywords</ControlLabel>
                        {" "}
                        <FormControl value={tags} onChange={updateKeywords} />
                        </FormGroup>
                    </Form>
                </ReactModal>
            </Form>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        updateEntry: (entry) => {
            dispatch(updateEntry(entry));
        },
    };
};

EntryForm.propTypes = {
    entry: React.PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntryForm);

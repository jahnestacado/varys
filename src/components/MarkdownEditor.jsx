import React, { Component } from "react";
import showdown from "showdown";
import "./MarkdownEditor.css";
import bindToComponent from "./../utils/bindToComponent.js";

class MarkdownEditor extends Component {
    constructor(props){
        super(props);
        const self = this;
        const { markdown, title } = props.entry;
        self.converter = new showdown.Converter();
        self.state = {
            generatedHtml: self.converter.makeHtml(`${self.getMarkdownTitleField()}${markdown}`),
            markdownInput: markdown || "",
            markdownWithTitle: "",
        };

        bindToComponent(self, ["onMarkdownChanged"]);
    }

    componentDidUpdate(){
        const self = this;
        const { markdownInput, markdownWithTitle } = self.state;
        const { title } = self.props.entry;
        if(!markdownWithTitle.startsWith(self.getMarkdownTitleField())){
            self.renderMarkdown(markdownInput);
        }
    }

    getMarkdownTitleField(){
        const { title } = this.props.entry;
        return `# ${title} \n`;

    }

    renderMarkdown(markdownInput = ""){
        const self = this;
        const { title } = self.props.entry;
        const markdownWithTitle = `# ${title} \n${markdownInput}`;
        self.props.updateMarkdown(markdownInput);
        const generatedHtml = self.converter.makeHtml(markdownWithTitle);
        self.setState({
            generatedHtml,
            markdownWithTitle,
        });
    }

    onMarkdownChanged(event) {
        const self = this;
        const markdownInput = event.target.value;
        self.setState({
            markdownInput,
        })
        self.renderMarkdown(markdownInput);
    }

    render() {
        const self = this;
        const { markdownInput, generatedHtml, title } = self.state;
        return (
            <div>
                <textarea value={markdownInput} className="MarkdownEditor-input-area" onChange={self.onMarkdownChanged} />
                <div className="MarkdownEditor-output-area" dangerouslySetInnerHTML={{__html: generatedHtml}} />
            </div>
        )
    }
}

MarkdownEditor.propTypes = {
    updateMarkdown: React.PropTypes.func.isRequired,
    entry: React.PropTypes.object.isRequired,
};

export default MarkdownEditor;

import React, { Component } from "react";
import showdown from "showdown";
import "./MarkdownEditor.css";
import bindToComponent from "./../utils/bindToComponent.js";

class MarkdownEditor extends Component {
    constructor(props){
        super(props);
        const self = this;
        const { markdown, title } = props.entry;
        const markdownInput = markdown
            ? markdown.replace(`# ${title}`, "")
            : ""
        ;
        self.converter = new showdown.Converter();
        self.state = {
            generatedHtml: self.converter.makeHtml(markdown),
            markdownInput,
            markdown: "",
        };

        bindToComponent(self, ["onMarkdownChanged"]);
    }

    componentDidUpdate(){
        const self = this;
        const { markdownInput, markdown } = self.state;
        const { title } = self.props.entry;
        if(!markdown.startsWith(`# ${title}`)){
            self.renderMarkdown(markdownInput);
        }
    }

    renderMarkdown(markdownInput = ""){
        const self = this;
        const { title } = self.props.entry;
        const markdown = `# ${title} \n${markdownInput}`;
        self.props.updateMarkdown(markdown);
        const generatedHtml = self.converter.makeHtml(markdown);
        self.setState({
            generatedHtml,
            markdown,
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
        const { markdownInput, generatedHtml } = self.state;
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

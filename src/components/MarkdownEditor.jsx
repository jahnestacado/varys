import React, { Component } from "react";
import showdown from "showdown";
import "./MarkdownEditor.css";

class MarkdownEditor extends Component {
    constructor(props){
        super(props);
        const { markdown } = props.initData;
        this.converter = new showdown.Converter();
        this.state = {
            generatedHtml: this.converter.makeHtml(markdown),
            markdownInput: markdown || "",
            markdown: "",
        };

    }

    componentDidUpdate(){
        const { markdownInput } = this.state;
        const { title } = this.props.initData;
        if(!this.state.markdown.startsWith(`# ${title}`)){
            this.renderMarkdown(markdownInput);
        }
    }

    renderMarkdown(markdownInput = ""){
        const { title } = this.props.initData;
        const markdown = `# ${title} \n${markdownInput}`;
        this.props.updateMarkdown(markdown);
        const generatedHtml = this.converter.makeHtml(markdown);
        this.setState({
            generatedHtml,
            markdown,
        });
    }

    onMarkdownChanged(event) {
        const markdownInput = event.target.value;
        this.setState({
            markdownInput,
        })
        this.renderMarkdown(markdownInput);
    }

    render() {
        return (
            <div>
                <textarea value={this.state.markdownInput} className="MarkdownEditor-input-area" onChange={(event) => this.onMarkdownChanged(event)} />
                <div className="MarkdownEditor-output-area" dangerouslySetInnerHTML={{__html:this.state.generatedHtml}} />
            </div>
        )
    }
}

MarkdownEditor.propTypes = {
    updateMarkdown: React.PropTypes.func.isRequired,
    initData: React.PropTypes.object.isRequired,
};

export default MarkdownEditor;

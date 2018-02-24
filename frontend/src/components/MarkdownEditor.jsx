import React, { Component } from "react";
import showdown from "showdown";
import "./MarkdownEditor.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { TextArea, Container } from "semantic-ui-react";

class MarkdownEditor extends Component {
    constructor(props) {
        super(props);
        const self = this;
        const { body, id } = props.entry;
        self.converter = new showdown.Converter();
        self.state = {
            generatedHtml: self.converter.makeHtml(`${self.getMarkdownTitleField()}${body}`),
            markdownInput: id ? body : "",
            markdownWithTitle: "",
        };

        bindToComponent(self, ["onMarkdownChanged"]);
    }

    componentDidUpdate() {
        const self = this;
        const { markdownInput, markdownWithTitle } = self.state;
        if (!markdownWithTitle.startsWith(self.getMarkdownTitleField())) {
            self.renderMarkdown(markdownInput);
        }
    }

    getMarkdownTitleField() {
        const { title } = this.props.entry;
        return `# ${title} \n`;
    }

    renderMarkdown(markdownInput = "") {
        const self = this;
        const { title } = self.props.entry;
        const markdownWithTitle = `# ${title} \n${markdownInput}`;
        self.props.updateBody(markdownInput);
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
        });
        self.renderMarkdown(markdownInput);
    }

    render() {
        const self = this;
        const { markdownInput, generatedHtml } = self.state;
        return (
            <div>
                <TextArea
                    value={markdownInput}
                    className="MarkdownEditor-input-area"
                    onChange={self.onMarkdownChanged}
                />
                <Container text className="MarkdownEditor-output-area">
                    <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                </Container>
            </div>
        );
    }
}

MarkdownEditor.propTypes = {
    updateBody: React.PropTypes.func.isRequired,
    entry: React.PropTypes.object.isRequired,
};

export default MarkdownEditor;

import React from "react";
import showdown from "showdown";
import { Container } from "semantic-ui-react";
const converter = new showdown.Converter();
const style = {
    fontSize: 14,
};

const MarkdownViewer = ({ entry, noTitle }) => {
    const { title, body } = entry;
    const content = noTitle ? body : `# ${title} \n${body}`;
    const generatedHtml = converter.makeHtml(content);
    return (
        <Container className="MarkdownViewer markdown-body" text style={style}>
            <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
        </Container>
    );
};

export default MarkdownViewer;

import React from "react";
import showdown from "showdown";
import { Container, Label } from "semantic-ui-react";
import "./MarkdownViewer.css";
const converter = new showdown.Converter();

const style = {
    fontSize: 14,
};

const MarkdownViewer = ({ entry, noTitle }) => {
    const { title, body } = entry;
    const content = noTitle ? body : `# ${title} \n${body}`;
    const generatedHtml = converter.makeHtml(content);
    // @TODO Create component that generates labels
    const keywordLabels = entry.tags.map((keyword, i) => {
        return (
            <Label key={i} color="teal" size="small" className="ResultListItem-label">
                {keyword}
            </Label>
        );
    });
    return (
        <Container className="MarkdownViewer markdown-body" text style={style}>
            <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
            <div className="MarkdownViewer-footer">{keywordLabels}</div>
        </Container>
    );
};

export default MarkdownViewer;

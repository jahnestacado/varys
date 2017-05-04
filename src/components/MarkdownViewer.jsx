import React from "react";
import showdown from "showdown";
import "./MarkdownViewer.css";
const converter = new showdown.Converter();

const MarkdownViewer = ({entry}) => {
    const { title, markdown } = entry;
    const generatedHtml = converter.makeHtml(`# ${title} \n${entry.markdown}`);
    return (
        <div className="MarkdownViewer">
            <div dangerouslySetInnerHTML={{__html: generatedHtml}} />
        </div>
    )
};

export default MarkdownViewer;

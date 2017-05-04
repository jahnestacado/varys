import React from "react";
import { ListGroup } from "react-bootstrap/lib";
import ResultListItem from "./ResultListItem.jsx";

const ResultList = ({results}) => {
    const listItems = results.map((entry) => {
        return (
            <ResultListItem entry={entry} key={entry.id} />
        )
    });
    return (
        <ListGroup>
            {listItems}
        </ListGroup>
    )
};

export default ResultList;

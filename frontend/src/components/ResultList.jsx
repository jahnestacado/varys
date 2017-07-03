import React, { Component } from "react";
import { ListGroup } from "react-bootstrap/lib";
import ResultListItem from "./ResultListItem.jsx";
import "./ResultList.css";

class ResultList extends Component {
    render(){
        const self = this;
        const { props } = self;
        const { entries } = props;
        const listItems = entries.map((entry) => {
            return (
                <ResultListItem entry={entry} key={entry.id} />
            );
        });
        return (
            <ListGroup className="ResultList">
                {listItems}
            </ListGroup>
        );
    }
}

ResultList.propTypes = {
    entries: React.PropTypes.array.isRequired,
};

export default ResultList;

import React, { Component } from "react";
import { ListGroup } from "react-bootstrap/lib";
import ResultListItem from "./ResultListItem.jsx";

class ResultList extends Component {
	render(){
		const self = this;
		const { props } = self;
		const { entries, refresh } = props;
		const listItems = entries.map((entry) => {
			return (
				<ResultListItem onEntryChanged={refresh} entry={entry} key={entry.id} />
			)
		});
		return (
			<ListGroup>
				{listItems}
			</ListGroup>
		)
	}
}

ResultList.propTypes = {
    entries: React.PropTypes.array.isRequired,
    refresh: React.PropTypes.func.isRequired,
};

export default ResultList;

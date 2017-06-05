import  React, { Component } from "react";
import { Glyphicon } from "react-bootstrap";
import "./DeleteEntry.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { deleteEntry } from "./../actions/entryActions.js";

class DeleteEntry extends Component {
	constructor(props){
		super(props);

		const self = this;
		bindToComponent(self, ["deleteEntry"]);
	}

	deleteEntry(event){
		event.stopPropagation();
		console.log("Ask for Confirmation!!!!!", this.props.entry);
		const self = this;
		const { entry, deleteEntry } = self.props;
		const url = `http://localhost:7676/entry`;
		fetch(url, {
			method: "DELETE",
			webPreferences: {
				webSecurity: false
			},
			body: JSON.stringify({id: entry.id}),
			headers: new Headers({
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			}),
		})
		.then(() => {
			// Handle fetch error is !response.ok
			deleteEntry(entry);
		})
		.catch(console.log);
	}

	render(){
		const self = this;
		return (
			<div className="DeleteEntry">
				<Glyphicon className="DeleteEntry-btn-delete" glyph="trash" onClick={self.deleteEntry} />
			</div>
		)
	}
}

const mapDispatchToProps = (dispatch) => {
    return {
        deleteEntry: (entry) => {
            dispatch(deleteEntry(entry));
        },
    }
};

DeleteEntry.propTypes = {
	entry: React.PropTypes.object.isRequired,
};

export default connect(null, mapDispatchToProps)(DeleteEntry);

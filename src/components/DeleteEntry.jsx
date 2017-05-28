import  React, { Component } from "react";
import { Glyphicon } from "react-bootstrap";
import "./DeleteEntry.css";
import bindToComponent from "./../utils/bindToComponent.js";

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
		const { entry, onEntryDeleted } = self.props;
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
			onEntryDeleted(entry);
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

DeleteEntry.propTypes = {
	entry: React.PropTypes.object.isRequired,
	onEntryDeleted: React.PropTypes.func.isRequired,
};

export default DeleteEntry;

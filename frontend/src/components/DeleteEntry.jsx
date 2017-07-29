import  React, { Component } from "react";
import { Glyphicon } from "react-bootstrap";
import "./DeleteEntry.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { deleteEntry } from "./../actions/entryActions.js";
import handleFetchError from "./../utils/handleFetchError.js";

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
        const { entry, deleteEntry, auth } = self.props;
        const url = "http://localhost:7676/api/v1/entry";
        fetch(url, {
            method: "DELETE",
            body: JSON.stringify({id: entry.id}),
            headers: new Headers({
                "Accept": "application/json",
                "Content-Type": "application/json",
                "JWT": auth.token,
            }),
        })
        .then(handleFetchError)
        .then(() => {
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
        );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        deleteEntry: (entry) => {
            dispatch(deleteEntry(entry));
        },
    };
};

DeleteEntry.propTypes = {
    entry: React.PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(DeleteEntry);

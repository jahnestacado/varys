import React, { Component } from "react";
import EntryForm from "./EntryForm.jsx";
import DeleteEntry from "./DeleteEntry.jsx";
import "./ResultListItem.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { Card, Image, Label, Dropdown } from "semantic-ui-react";
import { setActiveEntry } from "./../actions/entryActions.js";

class ResultListItem extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            entry: props.entry,
        };
        bindToComponent(self, ["displayEntry"]);
    }

    displayEntry() {
        const self = this;
        const { props } = self;
        self.props.setActiveEntry(props.entry);
    }

    render() {
        const self = this;
        const { displayEntry, props } = self;
        const { entry, auth } = props;
        const { username } = auth;
        const isEntryAuthor = entry.author === username;
        // @TODO Create component that generates labels
        const keywordLabels = entry.tags.map((keyword, i) => {
            return (
                <Label key={i} color="teal" size="mini" className="ResultListItem-label">
                    {keyword}
                </Label>
            );
        });
        return (
            <Card className="ResultListItem" onClick={displayEntry}>
                <Card.Content>
                    <Card.Header className="ResultListItem-id">
                        {`#${entry.id}`}
                        {username && (
                            <Card.Meta className="ResultListItem-actions">
                                {isEntryAuthor ? (
                                    <Dropdown
                                        className="ResultListItem-action"
                                        item
                                        icon="ellipsis vertical"
                                    >
                                        <Dropdown.Menu>
                                            <EntryForm entry={entry} type="edit" />
                                            <DeleteEntry entry={entry} />
                                        </Dropdown.Menu>
                                    </Dropdown>
                                ) : (
                                    <EntryForm
                                        className="ResultListItem-fork-btn"
                                        entry={entry}
                                        type="merge-request"
                                    />
                                )}
                            </Card.Meta>
                        )}
                        <Image
                            className="ResultListItem-avatar"
                            bordered
                            rounded
                            title={entry.author}
                            floated="right"
                            size="mini"
                            src="https://react.semantic-ui.com/assets/images/avatar/large/steve.jpg"
                        />
                    </Card.Header>
                    <Card.Description title={entry.title} className="ResultListItem-description">
                        {entry.title}
                    </Card.Description>
                    <Card.Content extra className="ResultListItem-label-panel">
                        {keywordLabels}
                    </Card.Content>
                </Card.Content>
            </Card>
        );
    }
}

ResultListItem.propTypes = {
    entry: React.PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        setActiveEntry: (entry) => dispatch(setActiveEntry(entry)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(ResultListItem);

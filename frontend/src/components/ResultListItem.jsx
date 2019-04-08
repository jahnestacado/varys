import React, { Component } from "react";
import DeleteEntry from "./DeleteEntry.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { Card, Image, Label, Dropdown, Icon } from "semantic-ui-react";
import { showEntry, showEntryEditor } from "./../actions/entryActions.js";

import "./ResultListItem.css";

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
        self.props.showEntry(props.entry, "readonly");
    }

    createEditorActionIcon(actionType, iconName, entry) {
        const self = this;
        const { props } = self;
        return (
            <Icon
                name={iconName}
                onClick={() =>
                    props.showEntryEditor({
                        type: actionType,
                        entry,
                    })
                }
            />
        );
    }

    render() {
        const self = this;
        const { displayEntry, props } = self;
        const { entry, auth } = props;
        const { username } = auth;
        const isEntryAuthor = entry.author === username;
        const iconName = isEntryAuthor ? "edit" : "fork";
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
                                            {self.createEditorActionIcon("edit", iconName, entry)}
                                            <DeleteEntry entry={entry} />
                                        </Dropdown.Menu>
                                    </Dropdown>
                                ) : (
                                    /* @TODO replace with Fragment after upgrading to React > 16*/
                                    <div>
                                        {self.createEditorActionIcon(
                                            "merge-request",
                                            iconName,
                                            entry
                                        )}
                                    </div>
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

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        showEntry: (entry) => dispatch(showEntry(entry)),
        showEntryEditor: (specs) => dispatch(showEntryEditor(specs)),
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(ResultListItem);

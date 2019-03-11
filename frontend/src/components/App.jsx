import React, { Component } from "react";
import AutoCompleteDropdown from "./AutoCompleteDropdown";
import ResultList from "./ResultList.jsx";
import EntryForm from "./EntryForm.jsx";
import NotificationPanel from "./NotificationPanel.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { setEntries, getEntries } from "./../actions/entryActions.js";
import { resumeUserSession } from "./../actions/authActions.js";
import { Header, Icon, Pagination } from "semantic-ui-react";
import EntryModal from "./EntryModal.jsx";

import "./App.css";

class App extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            activePage: 0,
            limit: 15,
            searchQuery: [],
        };
        bindToComponent(self, [
            "handlePaginationSelect",
            "requestSearch",
            "refreshSearchResults",
            "onQueryChange",
        ]);
    }

    componentWillMount() {
        const self = this;
        self.props.resumeUserSession();
    }

    componentWillReceiveProps(nextProps) {
        const self = this;
        if (!nextProps.auth.username) {
            self.props.history.push("/signin");
        }
    }

    convertQuery(query) {
        return query.length ? query.join(window.encodeURIComponent("&")) : "";
    }

    handlePaginationSelect(event, { activePage }) {
        const self = this;
        self.setState({
            activePage,
        });
    }

    requestSearch(searchQuery) {
        const self = this;
        const { props } = self;
        const query = self.convertQuery(searchQuery);
        if (query) {
            props.getEntries(query).then(() => {
                self.setState({
                    activePage: 1,
                });
            });
        } else {
            self.setState({
                activePage: 0,
            });
            props.setEntries([]);
        }
    }

    refreshSearchResults() {
        const self = this;
        self.requestSearch(self.state.searchQuery);
    }

    componentWillUpdate(newProps, newState) {
        const self = this;
        if (self.state.searchQuery !== newState.searchQuery) {
            self.requestSearch(newState.searchQuery);
        }
    }

    onQueryChange(newQuery) {
        const self = this;
        self.setState({ searchQuery: newQuery });
    }

    render() {
        const self = this;
        const { handlePaginationSelect, refreshSearchResults, state, onQueryChange } = self;
        const { activePage, limit } = state;
        const { entries } = self.props.entries;
        const totalPages = Math.ceil(entries.length / self.state.limit);
        const displayedEntriesOffset = (activePage - 1) * limit;
        const displayedEntries = entries.slice(
            displayedEntriesOffset,
            displayedEntriesOffset + limit
        );

        return (
            <div className="App">
                <Header className="App-header" textAlign="center" dividing={true} inverted={true}>
                    <Icon name="computer" circular />
                    <Header.Content>Varys</Header.Content>

                    <Header.Subheader className="App-subheader">
                        <NotificationPanel />
                        <span>{self.props.auth.username}</span>
                    </Header.Subheader>
                </Header>
                <div className="dropdown-container">
                    <AutoCompleteDropdown
                        onSelectionChange={onQueryChange}
                        placeholder={"Search..."}
                        fluid
                    />
                </div>
                <ResultList refresh={refreshSearchResults} entries={displayedEntries} />

                <EntryForm
                    className="EntryForm-btn-open"
                    onSubmit={refreshSearchResults}
                    type="add"
                    button
                    color="teal"
                    circular
                />

                {entries.length ? (
                    <Pagination
                        className="App-pagination-bar"
                        totalPages={totalPages}
                        onPageChange={handlePaginationSelect}
                        activePage={activePage}
                        firstItem={null}
                        lastItem={null}
                        prevItem={null}
                        nextItem={null}
                    />
                ) : (
                    ""
                )}
                <EntryModal />
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        entries: state.entries,
        auth: state.auth,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        getEntries: (query) => dispatch(getEntries(query)),
        setEntries: (entries) => dispatch(setEntries(entries)),
        resumeUserSession: () => dispatch(resumeUserSession()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

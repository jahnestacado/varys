import React, { Component } from "react";
import AutoCompleteDropdown from "./AutoCompleteDropdown";
import ResultList from "./ResultList.jsx";
import EntryForm from "./EntryForm.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { setEntries } from "./../actions/entryActions.js";
import { signin } from "./../actions/authActions.js";
import handleFetchError from "./../utils/handleFetchError.js";
import { Header, Icon, Pagination } from "semantic-ui-react";
import "./App.css";

class App extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            activePage: 0,
            limit: 15,
        };
        bindToComponent(self, ["handlePaginationSelect", "requestSearch", "refreshSearchResults"]);
    }

    componentWillMount() {
        const self = this;
        const sessionToken = window.localStorage.getItem("varys-session");
        if (sessionToken) {
            try {
                self.props.signin(sessionToken);
            } catch (error) {
                console.log(error);
            }
        }
    }

    convertQuery(q) {
        return q.length ? q.join(window.encodeURIComponent("&")) : "";
    }

    handlePaginationSelect(event, { activePage }) {
        const self = this;
        self.setState({
            activePage,
        });
    }

    requestSearch(props) {
        const self = this;
        const { setEntries, searchQuery } = props;
        const query = self.convertQuery(searchQuery);
        if (query) {
            const url = `http://localhost:7676/api/v1/search?query=${query}`;
            self.fetch(url, (json) => {
                self.setState({
                    activePage: 1,
                });
                setEntries(json.payload);
            });
        } else {
            self.setState({
                activePage: 0,
            });
            setEntries([]);
        }
    }

    fetch(url, onDone, onError = console.log) {
        fetch(url, {
            method: "GET",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json",
            }),
        })
            .then(handleFetchError)
            .then((response) => response.json())
            .then(onDone)
            .catch(onError);
    }

    refreshSearchResults() {
        const self = this;
        self.requestSearch(self.props);
    }

    componentWillReceiveProps(nextProps) {
        const self = this;
        if (self.props.searchQuery !== nextProps.searchQuery) {
            self.requestSearch(nextProps);
        }
    }

    render() {
        const self = this;
        const { handlePaginationSelect, refreshSearchResults, state } = self;
        const { activePage, limit } = state;
        const { entries } = self.props.results;
        const totalPages = Math.ceil(entries.length / self.state.limit);
        const displayedEntriesOffset = (activePage - 1) * limit;
        const displayedEntries = entries.slice(
            displayedEntriesOffset,
            displayedEntriesOffset + limit
        );

        return (
            <div className="App">
                <Header
                    className="App-header"
                    as="h2"
                    icon
                    textAlign="center"
                    size="large"
                    dividing={true}
                    inverted={true}
                >
                    <Icon name="computer" circular />
                    <Header.Content>Varys</Header.Content>
                </Header>
                <div className="dropdown-container">
                    <AutoCompleteDropdown />
                </div>
                <ResultList refresh={refreshSearchResults} entries={displayedEntries} />

                <EntryForm onSubmit={refreshSearchResults} />

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
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        results: state.results,
        auth: state.auth,
        searchQuery: state.searchQuery,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        setEntries: (entries) => {
            dispatch(setEntries(entries));
        },
        signin: (sessionToken) => {
            dispatch(signin(sessionToken));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

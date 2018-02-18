import React, { Component } from "react";
import AutoCompleteDropdown from "./AutoCompleteDropdown";
import ResultList from "./ResultList.jsx";
import EntryForm from "./EntryForm.jsx";
import { Pagination } from "react-bootstrap";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { setEntries } from "./../actions/entryActions.js";
import { signin } from "./../actions/authActions.js";
import handleFetchError from "./../utils/handleFetchError.js";
import { Header, Icon, Grid } from "semantic-ui-react";
import "./App.css";

class App extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            activePage: 0,
            limit: 15,
            offset: 0,
            totalPages: 0,
        };
        bindToComponent(self, [
            "handlePaginationSelect",
            "requestSearch",
            "refreshSearchResults",
        ]);
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

    handlePaginationSelect(selectedPage) {
        const self = this;
        const { setEntries, searchQuery } = self.props;
        const offset = selectedPage - 1;
        const query = self.convertQuery(searchQuery);
        const url = `http://localhost:7676/api/v1/search/?query=${query}&limit=${self
            .state.limit}&offset=${offset}`;
        self.fetch(url, (json) => {
            self.setState({
                activePage: selectedPage,
            });
            setEntries(json.payload);
        });
    }

    requestSearch(props) {
        const self = this;
        const { setEntries, searchQuery } = props;
        const query = self.convertQuery(searchQuery);
        if (query) {
            const url = `http://localhost:7676/api/v1/search?query=${query}&limit=${self
                .state.limit}&offset=0`;
            self.fetch(url, (json) => {
                self.setState({
                    totalPages: Math.ceil(json.totalMatches / self.state.limit),
                    activePage: 1,
                });
                setEntries(json.payload);
            });
        } else {
            self.setState({
                totalPages: 0,
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
        const { activePage, totalPages } = state;
        const { entries } = self.props.results;

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
                <ResultList refresh={refreshSearchResults} entries={entries} />
                <Pagination
                    onSelect={handlePaginationSelect}
                    bsSize={"medium"}
                    activePage={activePage}
                    items={totalPages}
                />

                <EntryForm onSubmit={refreshSearchResults} />
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
            2;
            dispatch(setEntries(entries));
        },
        signin: (sessionToken) => {
            dispatch(signin(sessionToken));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

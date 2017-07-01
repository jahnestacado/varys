import React, { Component } from "react";
// import { ListGroup, ListGroupItem, Col } "react-bootstrap/lib";
import ResultList from "./ResultList.jsx";
import EntryForm from "./EntryForm.jsx";
import { Col, Pagination, FormGroup, FormControl, InputGroup } from "react-bootstrap";
import "./App.css";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { setEntries } from "./../actions/entryActions.js";
import handleFetchError from "./../utils/handleFetchError.js";

class App extends Component {
    constructor(props){
        super(props);
        const self = this;
        self.state = {
            activePage: 0,
            limit: 15,
            offset: 0,
            totalPages: 0,
            query: "",
        };
        bindToComponent(self, [
            "handlePaginationSelect",
            "requestSearch",
            "refreshSearchResults",
        ]);
    }

    componentWillMount(){
        // verify if user is logged in
    }

    handlePaginationSelect(selectedPage) {
        const self = this;
        const { setEntries } = self.props;
        let offset = self.state.limit * selectedPage;
        const url = `http://localhost:7676/search/${this.state.query}/?limit=${self.state.limit}&offset=${selectedPage -1}`;
        self.fetch(
            url,
            (json) => {
                self.setState({
                    activePage: selectedPage,
                });
                setEntries(json.payload);
            }
        );
    }

    requestSearch(query){
        const self = this;
        const { setEntries } = self.props;
        if(query){
            const url = `http://localhost:7676/search/${query}/?limit=${self.state.limit}&offset=0`;
            self.fetch(
                url,
                (json) => {
                    self.setState({
                        totalPages: Math.ceil(json.totalMatches / self.state.limit),
                        activePage: 1,
                        query,
                    });
                    setEntries(json.payload);
                }
            );
        } else {
            self.setState({
                totalPages: 0,
                activePage: 0,
                query,
            });
            setEntries([]);
        }
    }

    fetch(url, onDone, onError = console.log) {
        fetch(url, {
            method: "GET",
            headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }),
        })
        .then(handleFetchError)
        .then((response) => response.json())
        .then(onDone)
        .catch(onError);
    }

    refreshSearchResults(){
        const self = this;
        self.requestSearch(self.state.query);
    }

    render() {
        const self = this;
        const { handlePaginationSelect , requestSearch, refreshSearchResults, state } = self;
        const { activePage, totalPages } = state;
        const { entries } = self.props.results;
        return (
            <div className="App" >
                <div className="App-header">
                    <h2>Welcome to Varys</h2>
                    <FormGroup className="App-search-bar">
                        <InputGroup>
                            <FormControl
                            type="text"
                            placeholder="Search..."
                            onChange={(event) => requestSearch(event.target.value)}
                            />
                        </InputGroup>
                    </FormGroup>
                </div>
                <Col sm={8} md={10} smOffset={2} mdOffset={1} >
                    <ResultList refresh={refreshSearchResults} entries={entries} />
                </Col>

                <Col sm={12} >
                    <Pagination
                    onSelect={handlePaginationSelect}
                    bsSize={"medium"}
                    activePage={activePage}
                    items={totalPages}
                    />
                </Col>

                <EntryForm onSubmit={refreshSearchResults}/>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        results: state.results,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        setEntries: (entries) => {
            dispatch(setEntries(entries));
        },
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

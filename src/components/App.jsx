import React, { Component } from "react";
// import { ListGroup, ListGroupItem, Col } "react-bootstrap/lib";
import ResultList from "./ResultList.jsx";
import AddEntry from "./AddEntry.jsx";
import { Col, Pagination, FormGroup, FormControl, InputGroup } from "react-bootstrap";
import "./App.css";

class App extends Component {
    constructor(props){
        super(props);
        this.state = {
            results: [],
            activePage: 0,
            limit: 3,
            offset: 0,
            totalPages: 0,
            query: "",
        }
    }

    componentWillMount(){
        // verify if user is logged in
    }

    handlePaginationSelect(selectedPage) {
        const self = this;
        let offset = this.state.limit * selectedPage;
        const url = `http://localhost:7676/search/${this.state.query}/?limit=3&offset=${selectedPage -1}`;
        this.fetch(
            url,
            (json) => {
                self.setState({
                    results: json.payload,
                    activePage: selectedPage,
                });
            }
        );
    }

    requestSearch(query){
        const self = this;
        if(query){
            const url = `http://localhost:7676/search/${query}/?limit=3&offset=0`;
            this.fetch(
                url,
                (json) => {
                    self.setState({
                        results: json.payload,
                        totalPages: Math.ceil(json.totalMatches / self.state.limit),
                        activePage: 1,
                        query,
                    });
                }
            );
        } else {
            self.setState({
                results: [],
                totalPages: 0,
                activePage: 0,
                query,
            });
        }
    }

    fetch(url, onDone, onError = console.log) {
        console.log("requesting", url);
        fetch(url, {
            method: "GET",
            webPreferences: {
                webSecurity: false
            },
        })
        .then((response) => response.json())
        .then(onDone)
        .catch(onError);
    }

    render() {
        return (
            <div className="App" >
                <div className="App-header">
                  <h2>Welcome to Varys</h2>
                  <FormGroup className="App-search-bar">
                      <InputGroup>
                          <FormControl
                              type="text"
                              placeholder="Search..."
                              onChange={(event) => this.requestSearch(event.target.value)}
                          />
                      </InputGroup>
                  </FormGroup>
                </div>
                <Col sm={8} md={10} smOffset={2} mdOffset={1} >
                    <ResultList results={this.state.results} />
                </Col>

                <Col sm={12} >
                    <Pagination
                        onSelect={(eventKey) => this.handlePaginationSelect(eventKey)}
                        bsSize={"medium"}
                        activePage={this.state.activePage}
                        items={this.state.totalPages}
                    />
                </Col>

                <AddEntry />
            </div>
        )
    }
}

export default App;

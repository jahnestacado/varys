import React, { Component } from "react";
import { Dropdown } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";
import handleFetchError from "./../utils/handleFetchError.js";
import { connect } from "react-redux";
import { updateSearchQuery } from "./../actions/searchQueryActions.js";

class AutoCompleteDropdown extends Component {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            options: [],
            isDropdownOpen: false,
            isFetchingData: false,
        };
        bindToComponent(self, [
            "onQueryChange",
            "onSearchChange",
            "filterSearch",
        ]);
    }

    filterSearch(options) {
        /* Due to limitations in Semantic-UI-Dropdown which clearSearchQuery the
        * dropdown query if new options are set we mark the 'old'
        * as disabled and then we filter this items out when we display the dropdown list
        */
        return options.filter((o) => !o.disabled);
    }

    disableOptions(oldOptions) {
        /* Due to limitations in Semantic-UI-Dropdown which clearSearchQuery the
        * dropdown query if new options are set we mark the 'old'
        * as disabled and then we filter this items out when we display the dropdown list
        */
        const disabledOptions = oldOptions.map((o) => {
            o.disabled = true;
            return o;
        });
        return disabledOptions;
    }

    onSearchChange(event, substring) {
        const self = this;
        if (substring.length > 1) {
            self.setState({ isFetchingData: true });
            fetch(`http://localhost:7676/api/v1/match?substring=${substring}`, {
                method: "GET",
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
            })
                .then(handleFetchError)
                .then((response) => response.json())
                .then((result) => {
                    setTimeout(() => {
                        if (result) {
                            const disabledOptions = self.disableOptions(
                                self.state.options,
                            );
                            self.setState({
                                options: result
                                    .map((value, i) => {
                                        return {
                                            key: `${Date.now()}${value}${i}`,
                                            text: value,
                                            value: value,
                                            /* Hack in order to force cleanup of
                                        *  input field  after item selection
                                        */
                                            "data-additional": true,
                                        };
                                    })
                                    .concat(disabledOptions),
                                isDropdownOpen: true,
                                isFetchingData: false,
                            });
                        }
                    }, 3000);
                })
                .catch((error) => {
                    console.error(error);
                    self.setState({ isFetchingData: false });
                });
        }
    }

    onQueryChange(event, data) {
        const self = this;
        const newQuery = data.value;
        const res = self.state.options.filter((d) =>
            newQuery.some((v) => v === d.text),
        );

        console.log("OnChange", newQuery);
        self.setState({
            options: res,
            isDropdownOpen: false,
        });

        self.props.updateSearchQuery(newQuery);
    }

    render() {
        const self = this;
        const { onSearchChange, onQueryChange, filterSearch } = self;
        const { options, isDropdownOpen, isFetchingData } = self.state;
        console.log("OnRender", options, self.props.query);
        return (
            <Dropdown
                multiple={true}
                fluid
                selection
                onSearchChange={onSearchChange}
                onChange={onQueryChange}
                options={options}
                value={self.props.query}
                minCharacters={2}
                open={isDropdownOpen}
                search={filterSearch}
                closeOnChange={true}
                onAddItem={() => true}
                placeholder={"Search..."}
                loading={isFetchingData}
                disabled={isFetchingData}
            />
        );
    }
}
const mapStateToProps = (state) => {
    return {
        query: state.searchQuery,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        updateSearchQuery: (query) => {
            dispatch(updateSearchQuery(query));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(
    AutoCompleteDropdown,
);

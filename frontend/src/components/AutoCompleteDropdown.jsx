import React, { Component } from "react";
import { Dropdown } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";
import handleFetchError from "./../utils/handleFetchError.js";

class AutoCompleteDropdown extends Component {
    constructor(props) {
        super(props);
        const self = this;
        bindToComponent(self, [
            "onQueryChange",
            "onSearchChange",
            "filterSearch",
            "onItemAddition",
        ]);
        const value = self.props.value;
        self.state = {
            options: value ? value.map((c, i) => self.createDropdownItem(c, i)) : [],
            isDropdownOpen: false,
            isFetchingData: false,
            value: value || [],
        };
    }

    filterSearch(options) {
        /* Due to limitations in Semantic-UI-Dropdown which clears the
        * dropdown query if new options are set we mark the 'old'
        * as disabled and then we filter this items out when we display the dropdown list
        */
        return options.filter((o) => !o.disabled);
    }

    disableOptions(oldOptions) {
        /* Due to limitations in Semantic-UI-Dropdown which clears the
        * dropdown query if new options are set we mark the 'old'
        * as disabled and then we filter this items out when we display the dropdown list
        */
        const disabledOptions = oldOptions.map((o) => {
            o.disabled = true;
            return o;
        });
        return disabledOptions;
    }

    onSearchChange(event, { searchQuery }) {
        const self = this;
        if (searchQuery.length > 1) {
            self.setState({ isFetchingData: true });
            fetch(
                `http://localhost:7676/api/v1/match?substring=${searchQuery}&type=${
                    self.props.type
                }`,
                {
                    method: "GET",
                    headers: new Headers({
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    }),
                }
            )
                .then(handleFetchError)
                .then((response) => response.json())
                .then((result) => {
                    if (result && result.length) {
                        const disabledOptions = self.disableOptions(self.state.options);
                        self.setState({
                            options: result
                                .map((value, i) => self.createDropdownItem(value, i))
                                .concat(disabledOptions),
                            isDropdownOpen: true,
                            isFetchingData: false,
                        });
                    } else {
                        self.setState({
                            isFetchingData: false,
                            isDropdownOpen: true,
                        });
                    }
                })
                .catch((error) => {
                    // @TODO Show error message
                    console.error(error);
                    self.setState({ isFetchingData: false });
                });
        }
    }

    onQueryChange(event, data) {
        const self = this;
        const newQuery = [].concat(data.value);
        const res = self.state.options.filter((d) => newQuery.some((v) => v === d.text));

        self.setState({
            options: res,
            isDropdownOpen: false,
            value: newQuery,
        });

        self.props.onSelectionChange && self.props.onSelectionChange(newQuery);
    }

    onItemAddition(event, data) {
        const self = this;
        const { options } = self.state;
        const newItem = data.value;
        const newOptions = options.concat(
            self.state.value.concat(newItem).map((c, i) => self.createDropdownItem(newItem, i))
        );

        self.setState({
            options: newOptions,
            isDropdownOpen: false,
            value: self.state.value.concat(newItem),
        });
    }

    createDropdownItem(itemName) {
        const dropdownItem = {
            key: `${Date.now()}${itemName}`,
            text: itemName,
            value: itemName,
            /* Hack in order to force cleanup of
        *  input field  after item selection
        */
            "data-additional": true,
        };

        return dropdownItem;
    }

    render() {
        const self = this;
        const { onSearchChange, onQueryChange, onItemAddition, filterSearch, props, state } = self;
        const { options, isDropdownOpen, isFetchingData, value } = state;
        const { upward, placeholder, allowAdditions, fluid } = props;

        return (
            <Dropdown
                fluid={fluid}
                selection
                multiple
                onSearchChange={onSearchChange}
                onChange={onQueryChange}
                options={options}
                value={value}
                minCharacters={2}
                open={isDropdownOpen}
                search={filterSearch}
                closeOnChange={true}
                placeholder={placeholder}
                loading={isFetchingData}
                disabled={isFetchingData}
                upward={upward}
                allowAdditions={allowAdditions}
                onAddItem={onItemAddition}
            />
        );
    }
}

export default AutoCompleteDropdown;

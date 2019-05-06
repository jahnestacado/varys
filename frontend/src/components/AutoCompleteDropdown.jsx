import React, { Component } from "react";
import { Dropdown } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";
import handleFetchError from "./../utils/handleFetchError.js";

class AutoCompleteDropdown extends Component {
    constructor(props) {
        super(props);
        const self = this;
        bindToComponent(self, ["onQueryChange", "onSearchChange", "onQueryListItemAddition"]);
        const queryList = self.props.value || [];
        self.state = {
            options: queryList.map(AutoCompleteDropdown.createDropdownOption),
            isFetchingData: false,
            queryList,
        };
    }

    static createDropdownOption = (value) => ({
        key: value,
        text: value,
        value,
    });

    onSearchChange(event, { searchQuery }) {
        const self = this;
        if (searchQuery.length > 1) {
            fetch(`/api/v1/match?substring=${searchQuery}&type=${self.props.type}`, {
                method: "GET",
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
            })
                .then(handleFetchError)
                .then((response) => response.json())
                .then((result) => {
                    let newState = {
                        isFetchingData: false,
                    };
                    if (result && result.length) {
                        const { options, queryList } = self.state;
                        const activeOptions = options.filter(({ value }) =>
                            queryList.includes(value)
                        );

                        newState = {
                            ...newState,
                            options: result
                                .map(AutoCompleteDropdown.createDropdownOption)
                                .concat(activeOptions),
                        };
                    }

                    self.setState(newState);
                })
                .catch((error) => {
                    // @TODO Show error message
                    console.error(error);
                    self.setState({ isFetchingData: false });
                });

            self.setState({ isFetchingData: true });
        }
    }

    onQueryChange(event, data) {
        const self = this;

        self.setState({
            queryList: data.value,
        });

        self.props.onSelectionChange && self.props.onSelectionChange(data.value);
    }

    onQueryListItemAddition(event, data) {
        const self = this;
        const options = self.state.options.concat(
            AutoCompleteDropdown.createDropdownOption(data.value)
        );
        self.setState({ options });
    }

    render() {
        const self = this;
        const { onSearchChange, onQueryChange, props, state, onQueryListItemAddition } = self;
        const { options, isFetchingData, queryList } = state;
        const { upward, placeholder, allowAdditions, fluid, autoFocus = false } = props;

        return (
            <Dropdown
                searchInput={{
                    autoFocus,
                }}
                fluid={fluid}
                selection
                multiple
                onSearchChange={onSearchChange}
                onChange={onQueryChange}
                options={options}
                value={queryList}
                minCharacters={2}
                search
                clearable
                closeOnChange
                placeholder={placeholder}
                loading={isFetchingData}
                disabled={isFetchingData}
                upward={upward}
                allowAdditions={allowAdditions}
                wrapSelection
                autoFocus
                onAddItem={onQueryListItemAddition}
            />
        );
    }
}

export default AutoCompleteDropdown;

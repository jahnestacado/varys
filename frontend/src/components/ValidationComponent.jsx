import React, { Component } from "react";
import { Message } from "semantic-ui-react";
import bindToComponent from "./../utils/bindToComponent.js";

class ValidationComponent extends Component {
    constructor(props) {
        super(props);
        const self = this;
        bindToComponent(self, ["onChange"]);
    }

    onChange(event, { name, value }) {
        const self = this;
        self.setState({
            [name]: value,
            errors: {},
        });
    }

    generateErrorMessages(errors) {
        return Object.keys(errors)
            .reduce((flatten, key) => {
                const value = errors[key];
                if (Array.isArray(value)) {
                    const temp = value.map((msg) => `'${key}' ${msg}`);
                    flatten = flatten.concat(temp);
                } else {
                    flatten.push(`'${key}' ${value}`);
                }
                return flatten;
            }, [])
            .map((msg, i) => (
                <Message key={i} size="small" color="red" content={msg} />
            ));
    }
}

export default ValidationComponent;

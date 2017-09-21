import React from "react";
import { Form, Grid, Segment, Header } from "semantic-ui-react";
import ValidationComponent from "./ValidationComponent.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import handleFetchError from "./../utils/handleFetchError.js";
import validator from "./../utils/inputValidation.js";
import "./SignUp.css";

class SignUp extends ValidationComponent {
    constructor(props) {
        super(props);
        const self = this;
        this.state = {
            username: "",
            email: "",
            password: "",
            confirmedPassword: "",
            errors: {},
        };

        bindToComponent(self, ["onSubmit", "validateInput"]);
    }

    onSubmit(event) {
        event.preventDefault();
        const self = this;
        const { username, email, password } = self.state;
        const body = {
            username,
            email,
            password,
        };

        const errors = self.validateInput();
        if (Object.keys(errors).length) {
            self.setState({ errors });
        } else {
            const url = "http://localhost:7676/api/v1/signup";
            fetch(url, {
                method: "POST",
                body: JSON.stringify(body),
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
            })
                .then(handleFetchError)
                .then(() => {
                    console.log("User created successfully");
                    self.props.history.push("/signin");
                })
                .catch((error) => {
                    self.setState({ errors: { request: error.message } });
                });
        }
    }

    validateInput() {
        const self = this;
        const { username, email, password, confirmedPassword } = self.state;
        const {
            validateUsername,
            validateEmail,
            validatePassword,
            validateConfirmedPassword,
        } = validator;
        const errors = {};
        const usernameErrors = validateUsername(username);
        const emailErrors = validateEmail(email);
        const passwordErrors = validatePassword(password);
        const confirmedPasswordErrors = validateConfirmedPassword(
            password,
            confirmedPassword,
        );
        if (usernameErrors.length) {
            errors.username = usernameErrors;
        }
        if (emailErrors.length) {
            errors.email = emailErrors;
        }
        if (passwordErrors.length) {
            errors.password = passwordErrors;
        }
        if (confirmedPasswordErrors.length) {
            errors.confirmedPassword = confirmedPasswordErrors;
        }

        return errors;
    }

    render() {
        const self = this;
        const { onSubmit, onChange, generateErrorMessages } = self;

        const {
            username,
            email,
            password,
            confirmedPassword,
            errors,
        } = self.state;
        const containErrors = !!Object.keys(errors).length;

        return (
            <Grid className="SignUp-form" centered>
                <Grid.Column mobile={16} tablet={8} computer={6}>
                    <Segment
                        attached
                        color={"teal"}
                        textAlign={"center"}
                        padded
                    >
                        <Header dividing size="large">
                            Sign Up
                        </Header>
                        <Form onSubmit={onSubmit} error={containErrors}>
                            <Form.Input
                                label="Username"
                                placeholder="Username"
                                name="username"
                                value={username}
                                error={!!errors.username}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="Email"
                                placeholder="Email"
                                name="email"
                                value={email}
                                error={!!errors.email}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="Password"
                                placeholder="Password"
                                name="password"
                                type="password"
                                value={password}
                                error={!!errors.password}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="Confirm"
                                placeholder="Confirm Password"
                                name="confirmedPassword"
                                type="password"
                                value={confirmedPassword}
                                error={!!errors.confirmedPassword}
                                onChange={onChange}
                            />
                            <Form.Button
                                content="SignUp"
                                color="teal"
                                size="big"
                                fluid
                            />
                            {containErrors && generateErrorMessages(errors)}
                        </Form>
                    </Segment>
                </Grid.Column>
            </Grid>
        );
    }
}

export default SignUp;

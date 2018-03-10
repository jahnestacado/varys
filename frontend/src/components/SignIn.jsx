import React from "react";
import { Form, Grid, Segment, Header } from "semantic-ui-react";
import ValidationComponent from "./ValidationComponent.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { signin, resumeUserSession } from "./../actions/authActions.js";
import "./SignIn.css";

class SignIn extends ValidationComponent {
    constructor(props) {
        super(props);
        const self = this;
        self.state = {
            username: "",
            password: "",
            errors: {},
        };
        bindToComponent(self, ["onSubmit", "validateInput"]);
    }

    onSubmit(event) {
        event.preventDefault();
        const self = this;
        const { username, password } = self.state;
        const body = {
            username,
            password,
        };
        const errors = self.validateInput();
        if (Object.keys(errors).length) {
            self.setState({ errors });
        } else {
            self.props.signin(body);
        }
    }

    validateInput() {
        const self = this;
        const { username, password } = self.state;
        const errors = {};
        if (username.length === 0) {
            errors.username = "is required";
        }
        if (password.length === 0) {
            errors.password = "is required";
        }

        return errors;
    }

    render() {
        const self = this;
        const { onSubmit, onChange, generateErrorMessages } = self;

        const { username, password, errors } = self.state;
        const containErrors = !!Object.keys(errors).length;

        return (
            <Grid className="SignIn-form" centered>
                <Grid.Column mobile={16} tablet={8} computer={6}>
                    <Segment attached color={"teal"} textAlign={"center"} padded>
                        <Header dividing size="large">
                            Sign In
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
                                label="Password"
                                placeholder="Password"
                                name="password"
                                type="password"
                                value={password}
                                error={!!errors.password}
                                onChange={onChange}
                            />
                            <Form.Button content="SignIn" color="teal" size="big" fluid />
                            {containErrors && generateErrorMessages(errors)}
                        </Form>
                    </Segment>
                </Grid.Column>
            </Grid>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        signin: (sessionInfo) => dispatch(signin(sessionInfo)),
        resumeUserSession: () => dispatch(resumeUserSession()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignIn);

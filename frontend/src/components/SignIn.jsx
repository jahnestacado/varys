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

    componentWillMount() {
        const self = this;
        self.props.dispatch(resumeUserSession());
    }

    componentWillReceiveProps(nextProps) {
        const self = this;
        if (nextProps.auth.username) {
            self.props.history.push("/");
        }
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
        const containsErrors = !!Object.values(errors).reduce((res, curr) => res.concat(curr), [])
            .length;
        if (containsErrors) {
            self.setState({ errors });
        } else {
            self.props.dispatch(signin(body));
        }
    }

    validateInput() {
        const self = this;
        const { username, password } = self.state;
        const { validateNotEmpty } = self;
        const errors = {};

        errors.username = validateNotEmpty(username);
        errors.password = validateNotEmpty(password);

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

const mapDispatchToProps = (dispatch) => ({ dispatch });

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SignIn);

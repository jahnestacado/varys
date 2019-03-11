import React from "react";
import { Form, Grid, Segment, Header } from "semantic-ui-react";
import ValidationComponent from "./ValidationComponent.jsx";
import bindToComponent from "./../utils/bindToComponent.js";
import { connect } from "react-redux";
import { resumeUserSession } from "./../actions/authActions.js";
import { getConfig, setConfig } from "./../actions/configActions.js";

class Config extends ValidationComponent {
    constructor(props) {
        super(props);
        const self = this;
        this.state = {
            smtpHost: "",
            smtpPort: "",
            emailAddress: "",
            emailPassword: "",
            host: "",
            port: "",
            errors: {},
        };

        bindToComponent(self, ["onSubmit", "validateInput"]);
    }

    componentWillReceiveProps(nextProps) {
        const self = this;
        if (!nextProps.auth.username) {
            self.props.history.push("/signin");
        } else if (nextProps.auth.role !== "superadmin") {
            nextProps.history.push("/");
        } else {
            self.props.getConfig().then((config = {}) => {
                const { smtp = {}, host, port } = config;
                self.setState({
                    smtpHost: smtp.host,
                    smtpPort: smtp.port,
                    emailAddress: smtp.address,
                    emailPassword: smtp.password,
                    host,
                    port,
                });
            });
        }
    }

    componentWillMount() {
        const self = this;
        self.props.resumeUserSession();
    }

    onSubmit(event) {
        event.preventDefault();
        const self = this;
        const { state, props } = self;
        const errors = self.validateInput();
        const containsErrors = !!Object.values(errors).reduce((res, curr) => res.concat(curr), [])
            .length;
        if (containsErrors) {
            self.setState({ errors });
        } else {
            const body = {
                host: state.host,
                port: state.port,
                smtp: {
                    address: state.emailAddress,
                    password: state.emailPassword,
                    host: state.smtpHost,
                    port: state.smtpPort,
                },
            };

            props.setConfig(body);
        }
    }

    validateInput() {
        const self = this;
        const { smtpHost, smtpPort, emailAddress, emailPassword, host, port } = self.state;
        const { validateEmail, validatePort, validateNotEmpty } = self;
        const errors = {};
        const hostErrors = validateNotEmpty(host);
        const portErrors = validatePort(port);
        const smtpPortErrors = validatePort(smtpPort);
        const smtpHostErrors = validateNotEmpty(smtpHost);
        const emailAddressErrors = validateEmail(emailAddress);
        const emailPasswordErrors = validateNotEmpty(emailPassword);

        errors.host = hostErrors;
        errors.port = portErrors;
        errors.smtpPort = smtpPortErrors;
        errors.smtpHost = smtpHostErrors;
        errors.emailAddress = emailAddressErrors;
        errors.emailPassword = emailPasswordErrors;

        return errors;
    }

    render() {
        const self = this;
        const { onSubmit, onChange, generateErrorMessages, state } = self;
        const { smtpHost, smtpPort, emailAddress, emailPassword, errors, host, port } = state;
        const containErrors = !!Object.keys(errors).length;
        return (
            <Grid className="Config-form" centered>
                <Grid.Column mobile={16} tablet={8} computer={6}>
                    <Segment attached color={"teal"} textAlign={"center"} padded>
                        <Header dividing size="large">
                            Varys Config
                        </Header>
                        <Form onSubmit={onSubmit} error={containErrors}>
                            <Form.Input
                                label="Host"
                                placeholder="Host"
                                name="host"
                                value={host}
                                error={!!errors.host}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="Port"
                                placeholder="Port"
                                name="port"
                                value={port}
                                error={!!errors.port}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="SMTP Host"
                                placeholder="SMTP Host"
                                name="smtpHost"
                                value={smtpHost}
                                error={!!errors.smtpHost}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="SMTP Port"
                                placeholder="SMTP Port"
                                name="smtpPort"
                                value={smtpPort}
                                error={!!errors.smtpPort}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="Email Address"
                                placeholder="Email Address"
                                name="emailAddress"
                                value={emailAddress}
                                error={!!errors.emailAddress}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="SMTP Password"
                                placeholder="SMTP Password"
                                name="emailPassword"
                                type="password"
                                value={emailPassword}
                                error={!!errors.emailPassword}
                                onChange={onChange}
                            />

                            <Form.Button content="Config" color="teal" size="big" fluid />
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
        resumeUserSession: () => dispatch(resumeUserSession()),
        getConfig: () => dispatch(getConfig()),
        setConfig: (config) => dispatch(setConfig(config)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Config);

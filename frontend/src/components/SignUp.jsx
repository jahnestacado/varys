import React, { Component } from "react";
import { Button, FormControl, FormGroup, Form , Col} from "react-bootstrap";
import bindToComponent from "./../utils/bindToComponent.js";
import handleFetchError from "./../utils/handleFetchError.js";
import "./SignUp.css";

class SignUp extends Component {
    constructor(props){
        super(props);
        const self = this;
        this.state = {
            username: "",
            email: "",
            password: "",
            confirmedPassword: "",
        };

        bindToComponent(self, [
            "onSubmit",
            "onChange",
        ]);
    }

    onSubmit(event){
        event.preventDefault();
        const self = this;
        const {username, email, password} = self.state;
        const body  = {
            username,
            email,
            password,
        };

        const url = "http://localhost:7676/api/v1/signup";
        fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: new Headers({
                "Accept": "application/json",
                "Content-Type": "application/json",
            }),
        })
        .then(handleFetchError)
        .then(() => {
            console.log("User created successfully");
        })
        .catch(console.log);
    }

    onChange(event, fieldName){
        const self = this;
        const newValue = event.target.value;
        self.setState({
            [fieldName]: newValue,
        });
    }

    render(){
        const self = this;
        return (
            <Form className="SignUp-form" onSubmit={self.onSubmit} horizontal>
                <FormGroup>
                    <Col sm={10}>
                        <FormControl onChange={(e) => self.onChange(e, "username")} className="form-control" placeholder="Username" />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col sm={10}>
                        <FormControl onChange={(e) => self.onChange(e, "email")} className="form-control" placeholder="Email" />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col sm={10}>
                        <FormControl type="password" placeholder="Password" className="form-control" onChange={(e) => self.onChange(e, "password")} />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col sm={10}>
                        <FormControl type="password" placeholder="Confirm Password" className="form-control" onChange={(e) => self.onChange(e, "confirmedPassword")} />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Button type="submit">SignUp</Button>
                </FormGroup>
            </Form>
        );
    }
}

export default SignUp;

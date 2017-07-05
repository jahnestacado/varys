import React, { Component } from "react";
import { Button, FormControl, FormGroup, Form , Col} from "react-bootstrap";
import bindToComponent from "./../utils/bindToComponent.js";
import handleFetchError from "./../utils/handleFetchError.js";
import "./SignIn.css";

class SignIn extends Component {
    constructor(props){
        super(props);
        const self = this;
        this.state = {
            username: "",
            password: "",
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

        const url = "http://localhost:7676/api/v1/SignIn";
        fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: new Headers({
                "Accept": "application/json",
                "Content-Type": "application/json",
            }),
        })
        .then(handleFetchError)
        .then((response) => response.json())
        .then((json) => {
            console.log("User successfully Signed In!!!", json);
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
            <Form className="SignIn-form" onSubmit={self.onSubmit} horizontal>
                <FormGroup>
                    <Col sm={10}>
                        <FormControl onChange={(e) => self.onChange(e, "username")} className="form-control" placeholder="Username" />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col sm={10}>
                        <FormControl type="password" placeholder="Password" className="form-control" onChange={(e) => self.onChange(e, "password")} />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Button type="submit">SignIn</Button>
                </FormGroup>
            </Form>
        );
    }
}

export default SignIn;

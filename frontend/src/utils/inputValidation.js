const InputValidation = {
    validateUsername(username) {
        const errors = [];
        if (!username.length) {
            errors.push("is required");
        } else if (username.length < 3 || username.length > 20) {
            errors.push("must be from 3 to 20 characters long");
        }

        return errors;
    },
    validateEmail(email) {
        const errors = [];
        const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!email.length) {
            errors.push("is required");
        } else if (!emailRegExp.test(email)) {
            errors.push("must be a valid email address");
        }

        return errors;
    },
    validateConfirmedPassword(password, confirmedPassword) {
        const errors = [];
        if (!confirmedPassword.length) {
            errors.push("is required");
        } else if (confirmedPassword !== password) {
            errors.push("must be identical to password");
        }

        return errors;
    },
    validatePassword(password) {
        const containsLowerCase = new RegExp("[a-z]");
        const containsUpperCase = new RegExp("[A-Z]");
        const containsNumber = new RegExp("\\d");
        const containsSymbol = new RegExp("[#$@!%&*?]");

        const errors = [];

        if (!password.length) {
            errors.push("is required");
        } else {
            if (password.length < 8 || password.length > 30) {
                errors.push("must be from 8 to 30 characters long");
            }
            if (!containsLowerCase.test(password)) {
                errors.push("must contain at least one lower case character");
            }
            if (!containsUpperCase.test(password)) {
                errors.push("must contain at least one upper case character");
            }
            if (!containsNumber.test(password)) {
                errors.push("must contain at least one numeric character");
            }
            if (!containsSymbol.test(password)) {
                errors.push(
                    "must contain at least one of this symbols #$@!%&*?",
                );
            }
        }

        return errors;
    },
};

export default InputValidation;

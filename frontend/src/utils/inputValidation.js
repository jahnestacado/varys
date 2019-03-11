const InputValidation = {
    validateUsername(username) {
        const errors = [].concat(InputValidation.validateNotEmpty(username));
        if (!errors.length && (username.length < 3 || username.length > 20)) {
            errors.push("must be from 3 to 20 characters long");
        }

        return errors;
    },
    validateEmail(email) {
        const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        const errors = [].concat(InputValidation.validateNotEmpty(email));
        if (!errors.length && !emailRegExp.test(email)) {
            errors.push("must be a valid email address");
        }

        return errors;
    },
    validateConfirmedPassword(password, confirmedPassword) {
        const errors = [].concat(InputValidation.validateNotEmpty(confirmedPassword));
        if (!errors.length && confirmedPassword !== password) {
            errors.push("must be identical to password");
        }

        return errors;
    },
    validatePassword(password) {
        const containsLowerCase = new RegExp("[a-z]");
        const containsUpperCase = new RegExp("[A-Z]");
        const containsNumber = new RegExp("\\d");
        const containsSymbol = new RegExp("[#$@!%&*?]");

        const errors = [].concat(InputValidation.validateNotEmpty(password));
        if (!errors.length) {
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
                errors.push("must contain at least one of this symbols #$@!%&*?");
            }
        }

        return errors;
    },
    validatePort(portAsStr) {
        const errors = [].concat(InputValidation.validateNotEmpty(portAsStr));
        if (!errors.length) {
            const port = Number(portAsStr);
            if (isNaN(port)) {
                errors.push("must be a number");
            } else if (port < 1 || port > 65535) {
                errors.push("invalid port range (1 - 65535)");
            }
        }

        return errors;
    },
    validateNotEmpty(str = "") {
        const errors = [];
        if (!str.length) {
            errors.push("is required");
        }
        return errors;
    },
};

export default InputValidation;

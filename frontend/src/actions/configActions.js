import Http from "./../utils/http.js";

export const getConfig = () => {
    return (dispatch, getState) => {
        const configUrl = "/api/v1/config";
        const JWT = getState().auth.token;
        return Http.get(configUrl, JWT).catch((error) => {
            // @TODO Handle error through an action
            console.error(error);
        });
    };
};

export const setConfig = (config) => {
    return (dispatch, getState) => {
        const configUrl = "/api/v1/config";
        const JWT = getState().auth.token;
        return Http.post(configUrl, JWT, {
            body: JSON.stringify(config),
        }).catch((e) => {
            console.log(e);
        });
    };
};

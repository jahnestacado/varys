const handleFetchError = (response) => {
    console.log(response);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response;
};

const request = (url, method, JWT = "", options = {}) => {
    const headers = new Headers(
        Object.assign(
            {
                Accept: "application/json",
                "Content-Type": "application/json",
                JWT,
            },
            options.headers
        )
    );
    delete options.headers;
    console.log("RWEWRWE", Object.assign({ method, headers }, options));
    return fetch(url, Object.assign({ method, headers }, options))
        .then(handleFetchError)
        .then((response) => response.json());
};

const Http = {
    get: (url, JWT, options) => request(url, "GET", JWT, options),
    put: (url, JWT, options) => request(url, "PUT", JWT, options),
    post: (url, JWT, options) => request(url, "POST", JWT, options),
    delete: (url, JWT, options) => request(url, "DELETE", JWT, options),
};

export default Http;

const handleFetchError = (response) => {
    if(!response.ok) {
        throw new Error(response.statusText);
    }
    return response;
};

export default handleFetchError;

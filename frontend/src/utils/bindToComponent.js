const bindToComponent = (context, funcNames) => {
    funcNames.forEach((name) => {
        context[name] = context[name].bind(context);
    });
};

export default bindToComponent;

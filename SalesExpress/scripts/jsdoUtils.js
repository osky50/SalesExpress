var createDataSourceErrorFn = function (info) {
    var msg = "Error on create DataSource";
    app.showError(msg);
    if (info.errorObject !== undefined) {
        msg = msg + "\n" + info.errorObject;
    }
    console.log(msg);
};
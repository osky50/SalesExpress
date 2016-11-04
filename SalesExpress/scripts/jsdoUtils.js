var createDataSourceErrorFn = function (info) {
    var msg = "Error on create DataSource";
    MessageDialogController.showMessage(msg, "Error");
    if (info.errorObject !== undefined) {
        msg = msg + "\n" + info.errorObject;
    }
    console.log(msg);
};
var createDataSourceErrorFn = function (info) {
    var msg = "Error on create DataSource. ";
    if (info.errorObject !== undefined) {
        msg= msg + "\n" + info.errorObject;
    }
    MessageDialogController.showMessage(msg, "Error");
};
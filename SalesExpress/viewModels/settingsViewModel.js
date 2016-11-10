//"use strict";

(function (parent) {
    var settingsViewModel = kendo.observable({
        hostname: "",
        resourceName: "Settings",
        fromLogin: false,
        onBeforeShow: function (e) {
            $('#settingsView .hostname').val(app.hostname || "http://10.10.51.4:8080");
            // Set list title to resource name
            if (app.viewModels.settingsViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.settingsViewModel.resourceName);
            }
        },
        saveSettings: function (e) {
            var form = $(e.button).closest('form')[0];
            var enabledBackOrders = localStorage.getItem('enabledBackOrder') || false;
            var validator = $(form).kendoValidator({
                validateOnBlur: false,
            }).data('kendoValidator');
            if (!validator.validate())
                return;
            localStorage.setItem('SalesExpressHostName', $('#settingsView .hostname').val());
            if (app.viewModels.settingsViewModel.fromLogin) {
                app.viewModels.settingsViewModel.fromLogin = false;
                app.navigate("views/loginView.html");
            }
        },
    });
    parent.settingsViewModel = settingsViewModel;
})(app.viewModels);

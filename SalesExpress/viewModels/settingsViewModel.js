//"use strict";

(function (parent) {
    var settingsViewModel = kendo.observable({
        hostname: "",
        hostport: "",
        usessl: "",
        resourceName: "Settings",
        onBeforeShow: function (e) {
            app.viewModels.settingsViewModel.set("hostname", localStorage.getItem('SalesExpressHostName'));
            app.viewModels.settingsViewModel.set("hostport", localStorage.getItem('SalesExpressHostPort'));
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
            localStorage.setItem('SalesExpressHostName', app.viewModels.settingsViewModel.hostname || '')
            localStorage.setItem('SalesExpressHostPort', app.viewModels.settingsViewModel.hostport || '')
        },
    });
    parent.settingsViewModel = settingsViewModel;
})(app.viewModels);

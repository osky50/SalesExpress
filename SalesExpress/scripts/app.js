(function () {    
    var app = {
        data: {},
        mobileApp: {},
        jsdoSession: {},
        views: {},
        viewModels: {},
    };

    var bootstrap = function () {
        $(function () {
            try {
                $.jqplot.config.enablePlugins = true;
                app.mobileApp = new kendo.mobile.Application(document.body, {

                    // you can change the default transition (slide, zoom or fade)
                    transition: 'slide',
                    // comment out the following line to get a UI which matches the look
                    // and feel of the operating system
                    skin: 'flat',
                    // the application needs to know which view to load first
                    initial: 'views/loginView.html',
                    layout: "tabstrip-layout",
                    statusBarStyle: 'black-translucent'
                });

                // Session management - behavior deoends on authentication model speecified in JSDO instance for session in jsdoSettings.js
                progress.util.jsdoSettingsProcessor(jsdoSettings);

                if (!jsdoSettings.authenticationModel) {
                    console.log("Warning: jsdoSettings.authenticationModel not specified. Default is ANONYMOUS");
                }

                if (jsdoSettings.serviceURI) {
                    app.jsdosession = new progress.data.JSDOSession(jsdoSettings);
                }
                else {
                    console.log("Error: jsdoSettings.serviceURI must be specified.");
                }

                if (app.jsdosession && app.isAnonymous()) {
                    // Login as anonymous automatically, data will be available on list page
                    $('#loginIcon').hide();
                    app.viewModels.loginViewModel.login();
                }

                if (app.jsdosession && app.autoLogin) {
                    // Login as anonymous automatically, data will be available on list page
                    $('#loginIcon').hide();
                    app.viewModels.loginViewModel.username = "gouser";
                    app.viewModels.loginViewModel.password = "gouser";
                    app.viewModels.loginViewModel.login();
                }
            }
            catch (ex) {
                console.log("Error creating JSDOSession: " + ex);
            }
        });
    };

    if (window.cordova) {
        // this function is called by Cordova when the application is loaded by the device
        document.addEventListener('deviceready', function () {
            // hide the splash screen as soon as the app is ready. otherwise
            // Cordova will wait 5 very long seconds to do it for you.
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
            bootstrap();
        }, false);
    } else {
        bootstrap();
    }

    window.app = app;

    app.isOnline = function () {
        if (!navigator || !navigator.connection) {
            return true;
        } else {
            return navigator.connection.type !== 'none';
        }
    };

    app.isAnonymous = function () {
        // authenticationModel defaults to "ANONYMOUS"
        if (!jsdoSettings.authenticationModel ||
             jsdoSettings.authenticationModel.toUpperCase() === "ANONYMOUS") {
            return true;
        }

        return false;
    };
    app.getErrors = function (restResultArr) {
        var errors = '';
        for (var i = 0; i < restResultArr.length; i++) {
            var restResul = restResultArr[i];
            if (restResul.ErrorNo > 0) {
                errors += restResul.Description + '\n';
            }
        }
        if (errors)
            app.showError(errors);
        return errors;
    };
    app.showError = function (message) {
        app.showMessage(message);
    };
    app.showMessage = function (message) {
        if (navigator && navigator.notification) {
            navigator.notification.alert(message);
        } else {
            // if run directly in browser
            alert(message);
        }
    };
    app.changeTitle = function (customTitle) {
        if (app.mobileApp.view()) {
            app.mobileApp.view().header.find('[data-role="navbar"]').data('kendoMobileNavBar').title(customTitle);
            //$("#navbar").data("kendoMobileNavBar").title(customTitle);
        }
    };

    app.onSelectTab = function (e) {
        if (e.item[0].id == "listIcon") {
            if (!app.viewModels.loginViewModel.isLoggedIn && !app.isAnonymous()) {
                app.showError("Please login first.");
                e.preventDefault();
            }
        }
    };

    app.clearData = function (vm) {
        var clearModel = function (m) {
            if (m.jsdoModel && m.jsdoModel._clearData) { //cleaning jsdo
                m.jsdoModel._clearData()
            }
            if (m.jsdoDataSource && m.jsdoDataSource.data().length) { //cleaning datasource
                m.jsdoDataSource.data([]);
            }
        }
        if (vm) {
            clearModel(vm);
        }
        else {
            for (var vmName in app.viewModels) {
                var vm = app.viewModels[vmName];
                clearModel(vm);
            }
        }
    }
    app.back = function () {
        app.mobileApp.navigate("#:back");
    };

    app.autoLogin = true;

    app.logout = function () {
        app.mobileApp.navigate('views/loginView.html');
    };
    app.customerDetails = function () {
        app.mobileApp.navigate('views/customerDetView.html');
    };
    app.updateShoppingCartQty = function () {
        //configuring JSDO Settings
        jsdoSettings.resourceName = 'dsOrder';
        jsdoSettings.tableName = 'eOrder';
        // create JSDO
        var shoppingCartJsdoModel = new progress.data.JSDO({
            name: jsdoSettings.resourceName,
            autoFill: false
        });
        var promise = shoppingCartJsdoModel.invoke('CartRead', {});
        promise.done(function (session, result, details) {
            try {
                var shopcart = null;
                if (details.response.dsOrder.dsOrder.eOrder && details.response.dsOrder.dsOrder.eOrder.length) {
                    var shopcart = details.response.dsOrder.dsOrder.eOrder[0];
                    if (!shopcart.eOrderLine || !shopcart.eOrderLine.length)
                        shopcart = null;
                }
                if (shopcart) {
                    $('.shopcart-header-info').text('(' + shopcart.eOrderLine.length + ')');
                } else {
                    $('.shopcart-header-info').text('');
                }
            } catch (e) {

            }
        });
        promise.fail(function () {
            app.showError('Failed to retrieve Shopping Cart details.')
        });
    };
    app.closeImagePopup = function () {
        $("#imagePopup").data("kendoMobileModalView").close();
    }
    app.pageSize = 10;
}());
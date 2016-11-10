(function () {
    var app = {
        data: {},
        mobileApp: {},
        jsdoSettings: {},
        jsdoSession: {},
        views: {},
        viewModels: {},
    };
    var bootstrap = function () {
        $(function () {
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
    app.readSettings = function () {
        app.hostname = localStorage.getItem('SalesExpressHostName') || '';        
        if (app.hostname) {
            var isUrlValid = function (url) {
                return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
            };
            //testing hostname url
            if (!isUrlValid(app.hostname)) {
                app.hostname = '';
                localStorage.setItem('SalesExpressHostName', '');
            }
            return true;
        } else
            return false;
    },
    app.isOnline = function () {
        if (!navigator || !navigator.connection) {
            return true;
        } else {
            return navigator.connection.type !== 'none';
        }
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
            MessageDialogController.showMessage(errors, "Error");
        return errors;
    };
    app.changeTitle = function (customTitle) {
        if (app.mobileApp.view()) {
            app.mobileApp.view().header.find('[data-role="navbar"]').data('kendoMobileNavBar').title(customTitle);
            //$("#navbar").data("kendoMobileNavBar").title(customTitle);
        }
    };
    app.onSelectTab = function (e) {
        if (e.item[0].id == "listIcon") {
            if (!app.viewModels.loginViewModel.isLoggedIn) {
                MessageDialogController.showMessage("Please login first", "Error");
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
    app.navigate = function (url) {
        var currentView = app.mobileApp.view() ? app.mobileApp.view().id : '';
        if (currentView == url)
            return;
        if (app.beforeNavigate) {
            var callback = function () {
                app.mobileApp.navigate(url);
            };
            app.beforeNavigate(callback);
        } else
            app.mobileApp.navigate(url);
    };
    app.back = function () {
        app.navigate("#:back");
    };
    app.autoLogin = true;
    app.onViewShow = function (e) {
        if (!e.view.model)
            return;
        app.beforeNavigate = e.view.model.beforeNavigate;
        var backButton = $('.back-button');
        if (e.view.model.backButton) {
            backButton.show();
            //backButton.attr('href', '#' + e.view.model.backTo);
        } else {
            backButton.hide();
        }
    };
    app.updateShoppingCartQty = function () {
        //configuring JSDO Settings
        app.jsdoSettings.resourceName = 'dsOrder';
        app.jsdoSettings.tableName = 'eOrder';
        // create JSDO
        var shoppingCartJsdoModel = new progress.data.JSDO({
            name: app.jsdoSettings.resourceName,
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
            MessageDialogController.showMessage("Failed to retrieve Shopping Cart details", "Error");
        });
    };
    app.closeImagePopup = function () {
        $("#imagePopup").data("kendoMobileModalView").close();
    },
    app.scan = function (calbackFn) {
        var that = this;
        if (window.navigator.simulator === true) {
            alert("Not Supported in Simulator.");
        }
        else {
            try {
                cordova.plugins.barcodeScanner.scan(
                function (result) {
                    if (!result.cancelled) {
                        calbackFn(result.format, result.text);
                    }
                },
                function (error) {
                    MessageDialogController.showMessage("Scanning failed: " + error, "Error");
                });
            } catch (e) {
                alert('Scanning failed: ' + e.message);
            }
        }
    },
    app.pageSize = 10;
}());
//"use strict";

(function (parent) {
    var loginViewModel = kendo.observable({
        username: "",
        password: "",
        isLoggedIn: false,
        loginViewTitle: "Log In",
        loginLabel: "Log In",
        logoutLabel: "Log Out",
        shoppingCartJsdoModel: undefined,
        sysParametersList: [
            { number: -3, name: 'defaultLocation', doNotRequest: true },
            { number: -2, name: 'defaultControlEnt', doNotRequest: true },
            { number: -1, name: 'defaultCustomer', doNotRequest: true },
            { number: 2265, name: 'enabledBuyMultiLocations' },
            { number: 8002, name: 'enabledBackOrder' },
            { number: 2559, name: 'facebookUrl' },
            { number: 2560, name: 'twitterUrl' },
        ],
        onInit: function () {
            //looking for required settings...
            if (!app.readSettings()) {
                app.navigate('views/settingsView.html'); //missing settings..going to settings page
                return;
            }
        },
        onBeforeShow: function (e) {
            // Always clear password
            app.viewModels.loginViewModel.set("username", "");
            app.viewModels.loginViewModel.set("password", "");
            // If logged in, show welcome message
            if (app.viewModels.loginViewModel.isLoggedIn) {
                app.changeTitle(app.viewModels.loginViewModel.logoutLabel);
                $("#credentials").parent().hide();
                $("#username").parent().hide();
                $("#password").parent().hide();
                $("#welcome").parent().show();
            } else {
                //showing login screen
                app.changeTitle(app.viewModels.loginViewModel.loginLabel);
                $("#credentials").parent().show();
                $("#username").parent().show();
                $("#password").parent().show();
                $("#welcome").parent().hide();
                if (app.autoLogin) { //only used first time
                    // Login as anonymous automatically, data will be available on list page                    
                    $('#loginIcon').hide();
                    app.viewModels.loginViewModel.username = "gouser";
                    app.viewModels.loginViewModel.password = "gouser";
                    app.viewModels.loginViewModel.login();
                    return;
                }
            }
        },
        validUrl: function (url, validUrlCallback) {
            $.ajax({
                url: url,
                async: false,
                success: function () {
                    validUrlCallback();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    app.viewModels.loginViewModel.loginErrorFn(progress.data.Session.GENERAL_FAILURE,
                        { errorObject: "Failed to connect with Host. Please review your settings." });
                    app.navigate('views/settingsView.html'); //missing settings..going to settings page
                },
                timeout: 1000
            });
        },
        login: function (e) {
            app.autoLogin = false;
            if (e) {
                var form = e.button.closest('form');
                var validator = $(form).kendoValidator({
                    validateOnBlur: false,
                }).data('kendoValidator');
                if (!validator.validate())
                    return;
            }
            var validUrlCallback = function () {
                if (app.jsdoSession == undefined) {
                    try {
                        app.jsdoSettings = {
                            "serviceURI": app.hostname + "/LatitudeIpadService/",
                            "catalogURIs": app.hostname + "/LatitudeIpadService/rest/static/LatitudeIpadService.json",
                            "authenticationModel": "Basic",
                            "resourceName": "",
                            "tableName": ""
                        };
                        progress.util.jsdoSettingsProcessor(app.jsdoSettings);
                        app.jsdoSession = new progress.data.JSDOSession(app.jsdoSettings);
                    } catch (e) {
                        alert('Error instantiating session: ' + e.message);
                        return;
                    }
                }
                try {
                    var promise = app.jsdoSession.login(app.viewModels.loginViewModel.get("username"),
                        app.viewModels.loginViewModel.get("password"));
                    promise.done(function (jsdo, result, info) {
                        try {
                            app.viewModels.loginViewModel.set("isLoggedIn", true);
                            var catPromise = app.jsdoSession.addCatalog(app.jsdoSettings.catalogURIs);
                            catPromise.done(function (jsdo, result, details) {
                                //getting system parameters
                                app.jsdoSettings.resourceName = "dsSystem";
                                var jsdoParameters = new progress.data.JSDO({
                                    name: app.jsdoSettings.resourceName,
                                    autoFill: false,
                                });
                                //creating parameters list to be requested
                                var requestedParamsList = [];
                                for (var i = 0; i < app.viewModels.loginViewModel.sysParametersList.length; i++) {
                                    if (app.viewModels.loginViewModel.sysParametersList[i].doNotRequest)
                                        continue;
                                    var param = {
                                        "Param_No": app.viewModels.loginViewModel.sysParametersList[i].number,
                                        "Param_EntVal": app.viewModels.loginViewModel.get("username")
                                    }
                                    requestedParamsList.push(param);
                                }
                                var paramsPromise = jsdoParameters.invoke('GetParam', { "dsSystem": { "ParamList": requestedParamsList } });
                                paramsPromise.done(function (jsdo, result, details) {
                                    //storing all parameters in the localStorage
                                    for (var i = 0; i < details.response.dsSystem.dsSystem.ParamList.length; i++) {
                                        var paramData = details.response.dsSystem.dsSystem.ParamList[i];
                                        var paramDefinition = app.viewModels.loginViewModel.sysParametersList.filter(
                                            function (p) {
                                                return p.number == paramData.Param_No;
                                            });
                                        if (!paramDefinition.length) //we do noa ask for this parameters
                                            continue;
                                        paramDefinition = paramDefinition[0];
                                        //converting boolean values
                                        if (paramData.Param_Value === 'yes')
                                            paramData.Param_Value = true;
                                        else if (paramData.Param_Value === 'no')
                                            paramData.Param_Value = false;
                                        localStorage.setItem(paramDefinition.name, paramData.Param_Value);
                                    }
                                    app.viewModels.loginViewModel.startApplication();
                                });
                                paramsPromise.fail(function (jsdo, result, details) {
                                    app.viewModels.loginViewModel.addCatalogErrorFn(progress.data.Session.GENERAL_FAILURE, details);
                                });
                            });
                            catPromise.fail(function (jsdo, result, details) {
                                app.viewModels.loginViewModel.addCatalogErrorFn(progress.data.Session.GENERAL_FAILURE, details);
                            });
                        }
                        catch (ex) {
                            var details = [{ "catalogURI": app.jsdoSettings.catalogURIs, errorObject: ex }];
                            app.viewModels.loginViewModel.addCatalogErrorFn(progress.data.Session.GENERAL_FAILURE, details);
                        }
                    });
                    promise.fail(function (jsdo, result, info) {
                        app.viewModels.loginViewModel.loginErrorFn(result, info);
                    }); // end promise.fail
                }
                catch (ex) {
                    app.viewModels.loginViewModel.loginErrorFn(progress.data.Session.GENERAL_FAILURE, { errorObject: ex });
                }
            }
            app.viewModels.loginViewModel.validUrl(app.hostname + "/LatitudeIpadService/", validUrlCallback);
        },
        startApplication: function () {
            app.imageErrorUrl = localStorage.getItem('SalesExpressHostName') + '/lat/images/noimage.png';
            app.updateShoppingCartQty();
            $(".user-info").html(app.viewModels.loginViewModel.get("username"));
            $(".control-ent-info").html(localStorage.getItem('defaultControlEnt'));
            $(".customer-info").html(localStorage.getItem('defaultCustomer'));
            $(".location-info").html(localStorage.getItem("defaultLocation"));
            $(".login-info").show();
            app.navigate("views/prodListView.html");
        },
        logout: function (e) {
            var that = this,
                promise;

            if (e) {
                e.preventDefault();
            }
            try {
                promise = app.jsdoSession.logout();
                promise.done(function (jsdo, result, info) {
                    console.log("Success on logout()");
                    that.set("isLoggedIn", false);
                    $(".login-info").hide();
                    app.clearData(); //cleaning all data
                    app.viewModels.loginViewModel.onBeforeShow();
                });
                promise.fail(function (jsdo, result, info) {
                    app.viewModels.loginViewModel.logoutErrorFn(result, info);
                });
            }
            catch (ex) {
                app.viewModels.loginViewModel.logoutErrorFn(progress.data.Session.GENERAL_FAILURE, { errorObject: ex });
            }
        },
        checkEnter: function (e) {
            var that = this;
            if (e.keyCode === 13) {
                $(e.target).blur();
                that.login();
            }
        },
        addCatalogErrorFn: function (result, details) {
            var msg = "", i;
            if (details !== undefined && Array.isArray(details)) {
                for (i = 0; i < details.length; i += 1) {
                    msg = msg + "\nresult for " + details[i].catalogURI + ": " +
                        details[i].result + "\n    " + details[i].errorObject;
                }
            }
            MessageDialogController.showMessage(msg, "Error");
            // Now logout
            if (app.viewModels.loginViewModel.isLoggedIn) {
                app.viewModels.loginViewModel.logout();
            }
        },
        logoutErrorFn: function (result, info) {
            var msg = "Error on logout";
            MessageDialogController.showMessage(msg, "Error");
            if (info.errorObject !== undefined) {
                msg = msg + "\n" + info.errorObject;
            }
            if (info.xhr) {
                msg = msg + "\n" + "status (from jqXHT):" + info.xhr.status;
                msg = msg + " statusText (from jqXHT):" + info.xhr.statusText;
            }
            alert(msg);
        },
        loginErrorFn: function (result, info) {
            var msg = "Login failed: ";
            if (result === progress.data.Session.LOGIN_AUTHENTICATION_FAILURE) {
                msg = msg + " Invalid user or password";
            }
            else {
                if (info.xhr) {
                    msg = msg + "\n-status= \"" + info.xhr.status + "\"";
                    msg = msg + "\n-statusText= \"" + info.xhr.statusText + "\"";
                    if (info.xhr.status === 200) {
                        msg = msg + "\n-responseText= \"" + info.xhr.responseText + "\n";
                    }
                } else if (info.errorObject) {
                    msg = msg + "\n-statusText=\"" + info.errorObject + "\"";
                } else
                    msg = msg + "\n-statusText= \"unknown\"";
            }
            MessageDialogController.showMessage(msg, "Error");
        }
    });

    parent.loginViewModel = loginViewModel;

})(app.viewModels);

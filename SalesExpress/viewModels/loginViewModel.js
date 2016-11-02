//"use strict";

(function (parent) {
    var loginViewModel = kendo.observable({
        username: "",
        password: "",
        isLoggedIn: false,
        loginViewTitle: "Log In",
        loginLabel: "Log In",
        logoutLabel: "Log Out",
        sysParametersList: [
            { number: -3, name: 'defaultLocation', doNotRequest: true },
            { number: -2, name: 'defaultControlEnt', doNotRequest: true },
            { number: -1, name: 'defaultCustomer', doNotRequest: true },
            { number: 2265, name: 'enabledBuyMultiLocations' },
            { number: 8002, name: 'enabledBackOrder' },
            { number: 2559, name: 'facebookUrl' },
            { number: 2560, name: 'twitterUrl' },
        ],
        onBeforeShow: function (e) {
            // Always clear password
            app.viewModels.loginViewModel.set("password", "");
            if (!app.isAnonymous()) {
                if (app.viewModels.loginViewModel.isLoggedIn)
                    app.changeTitle(app.viewModels.loginViewModel.logoutLabel);
                else
                    app.changeTitle(app.viewModels.loginViewModel.loginLabel);
            }

            // If logged in, show welcome message
            if (app.viewModels.loginViewModel.isLoggedIn) {
                $("#credentials").parent().hide();
                $("#username").parent().hide();
                $("#password").parent().hide();
                $("#welcome").parent().show();
            } else {
                //else show login screen
                app.viewModels.loginViewModel.set("username", "");
                $("#credentials").parent().show();
                $("#username").parent().show();
                $("#password").parent().show();
                $("#welcome").parent().hide();
            }
        },

        onInit: function (e) {
        },

        login: function (e) {
            var that = this,
                details,
                promise;
            try {
                promise = app.jsdosession.login(this.get("username"), this.get("password"));
                promise.done(function (jsdosession, result, info) {
                    try {
                        console.log("Success on login()");
                        that.set("isLoggedIn", true);
                        var catPromise = jsdosession.addCatalog(jsdoSettings.catalogURIs);
                        catPromise.done(function (jsdosession, result, details) {
                            //getting system parameters
                            jsdoSettings.resourceName = "dsSystem";
                            var jsdoParameters = new progress.data.JSDO({
                                name: jsdoSettings.resourceName,
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
                                app.viewModels.loginViewModel.addCatalogErrorFn(
                                    jsdo,
                                    progress.data.Session.GENERAL_FAILURE,
                                    details);
                            });
                        });
                        catPromise.fail(function (jsdosession, result, details) {
                            app.viewModels.loginViewModel.addCatalogErrorFn(app.jsdosession,
                                progress.data.Session.GENERAL_FAILURE, details);
                        });
                    }
                    catch (ex) {
                        details = [{ "catalogURI": jsdoSettings.catalogURIs, errorObject: ex }];
                        app.viewModels.loginViewModel.addCatalogErrorFn(app.jsdosession,
                            progress.data.Session.GENERAL_FAILURE, details);
                    }

                });
                promise.fail(function (jsdosession, result, info) {
                    app.viewModels.loginViewModel.loginErrorFn(app.jsdosession, result, info);
                }); // end promise.fail
            }
            catch (ex) {
                app.viewModels.loginViewModel.loginErrorFn(app.jsdosession,
                    progress.data.Session.GENERAL_FAILURE,
                    { errorObject: ex });
            }
        },
        startApplication: function () {
            $(".user-info").html(app.viewModels.loginViewModel.get("username"));
            $(".control-ent-info").html(localStorage.getItem('defaultControlEnt'));
            $(".customer-info").html(localStorage.getItem('defaultCustomer'));
            $(".location-info").html(localStorage.getItem("defaultLocation"));
            $(".login-info").show();
            app.mobileApp.navigate("views/prodListView.html");
        },
        logout: function (e) {
            var that = this,
                promise;

            if (e) {
                e.preventDefault();
            }
            try {
                promise = app.jsdosession.logout();
                promise.done(function (jsdosession, result, info) {
                    console.log("Success on logout()");
                    that.set("isLoggedIn", false);
                    $(".login-info").hide();
                    app.viewModels.loginViewModel.onBeforeShow();

                    app.clearData(); //cleaning all data
                });
                promise.fail(function (jsdosession, result, info) {
                    app.viewModels.loginViewModel.logoutErrorFn(jsdosession, result, info);
                });
            }
            catch (ex) {
                app.viewModels.loginViewModel.logoutErrorFn(app.jsdosession,
                                                 progress.data.Session.GENERAL_FAILURE,
                                                 { errorObject: ex });
            }
        },


        checkEnter: function (e) {
            var that = this;
            if (e.keyCode === 13) {
                $(e.target).blur();
                that.login();
            }
        },

        addCatalogErrorFn: function (jsdo, result, details) {
            var msg = "", i;
            console.log("Error on addCatalog()");
            if (details !== undefined && Array.isArray(details)) {
                for (i = 0; i < details.length; i += 1) {
                    msg = msg + "\nresult for " + details[i].catalogURI + ": " +
                            details[i].result + "\n    " + details[i].errorObject;
                }
            }
            app.showError(msg);
            console.log(msg);
            // Now logout
            if (app.viewModels.loginViewModel.isLoggedIn) {
                app.viewModels.loginViewModel.logout();
            }
        },

        logoutErrorFn: function (jsdosession, result, info) {
            var msg = "Error on logout";
            app.showError(msg);
            if (info.errorObject !== undefined) {
                msg = msg + "\n" + info.errorObject;
            }
            if (info.xhr) {
                msg = msg + "\n" + "status (from jqXHT):" + info.xhr.status;
                msg = msg + " statusText (from jqXHT):" + info.xhr.statusText;
            }
            console.log(msg);
        },

        loginErrorFn: function (jsdosession, result, info) {
            var msg = "Error on login";

            if (result === progress.data.Session.LOGIN_AUTHENTICATION_FAILURE) {
                msg = msg + " Invalid userid or password";
            }
            else {
                msg = msg + " Service " + jsdoSettings.serviceURI + " is unavailable";
            }

            app.showError(msg);
            if (info.xhr) {
                msg = msg + " status (from jqXHT):" + info.xhr.status;
                msg = msg + " statusText (from jqXHT):" + info.xhr.statusText;
                if (info.xhr.status === 200) {
                    //something is likely wrong with the catalog, so dump it out     
                    msg = msg + "\nresponseText (from jqXHT):" + info.xhr.responseText;
                }
            }
            if (info.errorObject) {
                msg = msg + "\n" + info.errorObject;
            }
            console.log(msg);
        }
    });

    parent.loginViewModel = loginViewModel;

})(app.viewModels);

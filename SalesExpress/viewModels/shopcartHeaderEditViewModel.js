(function (parent) {
    var shopcartHeaderEditViewModel = kendo.observable({
        rowId: undefined,
        checksum: undefined,
        custId: undefined,
        custPO: undefined,
        carrierId: undefined,
        carrierIdList: [],
        requestDate: undefined,
        origRow: {},
        resourceName: 'Edit Shopping Cart',
        backButton: true,
        onShow: function () {
            app.viewModels.shopcartHeaderEditViewModel.rowId = app.viewModels.shopcartDetViewModel.shopCart.Rowid || '';
            app.viewModels.shopcartHeaderEditViewModel.checksum = app.viewModels.shopcartDetViewModel.shopCart.Checksum || '';
            app.viewModels.shopcartHeaderEditViewModel.custId = app.viewModels.shopcartDetViewModel.shopCart.CustId;
            app.viewModels.shopcartHeaderEditViewModel.custPO = app.viewModels.shopcartDetViewModel.shopCart.CustPO;
            app.viewModels.shopcartHeaderEditViewModel.carrierId = app.viewModels.shopcartDetViewModel.shopCart.CarrierId;
            app.viewModels.shopcartHeaderEditViewModel.requestDate = app.viewModels.shopcartDetViewModel.shopCart.RequestDate;
            kendo.bind($('#shopCartHeaderDetails'), app.viewModels.shopcartHeaderEditViewModel, kendo.mobile.ui);
            // Set list title to resource name
            if (app.viewModels.shopcartHeaderEditViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.shopcartHeaderEditViewModel.resourceName);
            }
        },
        onInit: function (e) {
            app.viewModels.shopcartHeaderEditViewModel.populateCarrierList();
        },
        populateCarrierList: function () {
            app.mobileApp.showLoading();
            app.viewModels.shopcartHeaderEditViewModel.set("carrierIdList", []);
            app.jsdoSettings.resourceName = 'RestGetRecord';
            var getCarrierListJSDOModel = new progress.data.JSDO({
                name: app.jsdoSettings.resourceName,
                autoFill: false,
            });
            var rparam = { "pTableName": "carrier" };
            var promise = getCarrierListJSDOModel.read(rparam);
            promise.done(function (session, result, details) {
                if (details.success == true) {
                    var errors = false;
                    try {
                        errors = app.getErrors(details.response.ProDataSet.wsResult);
                    } catch (e) {
                        alert("Error", e)
                    }
                    if (errors) {
                        app.mobileApp.hideLoading();
                        return;
                    }
                    // Executing call back as everything finshed successfully
                    // Parsing response                    
                    var carrierIdList = [];
                    try {
                        details.response.ProDataSet["T_carrier"].forEach(function (carrier) {
                            carrierIdList.push(carrier["Carrier-ID"]);
                        });
                    } catch (e) { }
                    app.viewModels.shopcartHeaderEditViewModel.set("carrierIdList", carrierIdList);
                    app.mobileApp.hideLoading();
                }
            });
            promise.fail(function () {
                app.mobileApp.hideLoading();
                MessageDialogController.showMessage('Saving notes failed', "Error");
            });

        },
        saveHeader: function (e) {
            debugger;
            app.mobileApp.showLoading();
            app.jsdoSettings.resourceName = 'RestCRUDRecord';
            var updateHeaderJSDOModel = new progress.data.JSDO({
                name: app.jsdoSettings.resourceName,
                autoFill: false,
            });
            var data = {
                "writeRequest": {
                    "ProDataSet": {
                        "T_So-trans": [
                          {
                              "Control-Ent": app.viewModels.shopcartDetViewModel.shopCart.ControlEnt,
                              "Trans-No": app.viewModels.shopcartDetViewModel.shopCart.TransNo,
                              "Trans-Code": app.viewModels.shopcartDetViewModel.shopCart.TransCode,
                              "Rowid": app.viewModels.shopcartHeaderEditViewModel.rowId,
                              "CheckSum": app.viewModels.shopcartHeaderEditViewModel.checksum,
                              "Cust-PO": app.viewModels.shopcartHeaderEditViewModel.custPO,
                              "Carrier-ID": app.viewModels.shopcartHeaderEditViewModel.carrierId,
                              "Request-Date": app.viewModels.shopcartHeaderEditViewModel.requestDate,
                              "Action": "Change",
                              "pUserId": app.viewModels.loginViewModel.username
                          }
                        ]
                    }
                }
            };
            var promise = updateHeaderJSDOModel.invoke('WriteRecord', data);
            promise.done(function (session, result, details) {
                debugger;
                if (details.success == true) {
                    var errors = false;
                    try {
                        var writeResponse = JSON.parse(details.response.writeResponse);
                        errors = app.getErrors(writeResponse.ProDataSet.wsResult);
                    } catch (e) {
                        alert("Error", e)
                    }
                    if (errors) {
                        app.mobileApp.hideLoading();
                        return;
                    }
                    // Executing call back as everything finshed successfully
                    app.back();
                }
            });
            promise.fail(function () {
                app.mobileApp.hideLoading();
                MessageDialogController.showMessage('Saving notes failed', "Error");
            });
        },
        cancel: function (e) {
            app.back();
        },
    });
    parent.shopcartHeaderEditViewModel = shopcartHeaderEditViewModel;

})(app.viewModels);

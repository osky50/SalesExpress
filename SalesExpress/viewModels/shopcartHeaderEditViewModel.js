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
            debugger;
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
                debugger;
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
                            carrierIdList.push(carrier["Carrier-ID"] + " - " + carrier.Description);
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
        saveNotes: function (e) {
            app.mobileApp.showLoading();
            app.jsdoSettings.resourceName = 'dsOrder';
            var updateNotesJSDOModel = new progress.data.JSDO({
                name: app.jsdoSettings.resourceName,
                autoFill: false,
            });
            var data = {
                "dsOrder": {
                    "eOrder": [
                      {
                          "ControlEnt": app.viewModels.shopcartDetViewModel.shopCart.ControlEnt,
                          "TransNo": app.viewModels.shopcartDetViewModel.shopCart.TransNo,
                          "TransCode": app.viewModels.shopcartDetViewModel.shopCart.TransCode,
                          "eOrderNote": [
                            {
                                "TransNo": app.viewModels.shopcartDetViewModel.shopCart.TransNo,
                                "TransCode": app.viewModels.shopcartDetViewModel.shopCart.TransCode,
                                "CarrierId": app.viewModels.shopcartHeaderEditViewModel.carrierId,
                                "Rowid": app.viewModels.shopcartHeaderEditViewModel.rowId,
                                "CheckSum": app.viewModels.shopcartHeaderEditViewModel.checksum,
                                "CustId": app.viewModels.shopcartHeaderEditViewModel.custId
                            }
                          ]
                      }
                    ]
                }
            };
            var promise = updateNotesJSDOModel.invoke('SaveNotes', data);
            promise.done(function (session, result, details) {
                if (details.success == true) {
                    var errors = false;
                    try {
                        errors = app.getErrors(details.response.dsOrder.dsOrder.restResult);
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

(function (parent) {
    var shopcartDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        shopCart: undefined,
        origRow: {},
        resourceName: 'Shopping Cart',
        forceLoad: false,
        onBeforeShow: function () {
            var shopcartLines = $("#shopcartLines").data("kendoMobileListView");
            if (shopcartLines === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.shopcartDetViewModel.onInit(this);
            } else if (shopcartLines.dataSource && shopcartLines.dataSource.data().length === 0 ||
                app.viewModels.shopcartDetViewModel.forceLoad) {
                shopcartLines.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.shopcartDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.shopcartDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.shopcartDetViewModel.createJSDODataSource();
                app.views.listView = e.view;
                // Create list
                $("#shopcartLines").kendoMobileListView({
                    dataSource: app.viewModels.shopcartDetViewModel.jsdoDataSource,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    template: kendo.template($("#shopcartLineTemplate").html()),
                    click: function (e) {
                        app.viewModels.shopcartDetViewModel.set("selectedRow", e.dataItem);
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'update-line') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                //analizing "enabledBackOrders" parameter
                                var enabledBackOrders = localStorage.getItem('enabledBackOrder') || false;
                                if (!enabledBackOrders || enabledBackOrders == 'false') {
                                    var afs = parseFloat(button.dataset.afs);
                                    $(input).attr('max', afs); //adding max attribute which AFS
                                }
                                var validator = $(form).kendoValidator({
                                    validateOnBlur: false
                                }).data('kendoValidator');
                                if (!validator.validateInput($(input)))
                                    return;
                                var orderQty = parseInt(input.val());
                                app.viewModels.shopcartDetViewModel.updateLine(orderQty);
                            }
                            else if (button.name == 'delete-line') {
                                var callback = function (index) {
                                    debugger;
                                    if (index == 1)
                                        app.viewModels.shopcartDetViewModel.updateLine(0);
                                }
                                MessageDialogController.showConfirm("Are you sure you want to delete the line?", callback, "Yes,No", "Delete Line");
                            }
                        } catch (e) { }
                    }
                });
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        createJSDODataSource: function () {
            try {
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsOrder';
                jsdoSettings.tableName = 'eOrder';
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false
                });
                this.jsdoDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            var promise = app.viewModels.shopcartDetViewModel.jsdoModel.invoke('CartRead', {});
                            promise.done(function (session, result, details) {
                                var shopcart = null;
                                if (details.response.dsOrder.dsOrder.eOrder && details.response.dsOrder.dsOrder.eOrder.length) {
                                    var shopcart = details.response.dsOrder.dsOrder.eOrder[0];
                                    if (!shopcart.eOrderLine || !shopcart.eOrderLine.length)
                                        shopcart = null;
                                }
                                app.viewModels.shopcartDetViewModel.shopCart = shopcart;
                                if (shopcart) {
                                    $('.shopcart-header-info').text('(' + shopcart.eOrderLine.length + ')');
                                    $('.shopcart-info').show();
                                    $('.shopcart-placeholder').hide();
                                    //adding Currency to each line for making easier to show it
                                    shopcart.eOrderLine.forEach(function (line) {
                                        line.CurrencyId = shopcart.CurrencyId;
                                    });
                                    options.success(shopcart.eOrderLine);
                                    //binding header
                                    kendo.bind($('#shopcartHeader'), shopcart, kendo.mobile.ui);
                                } else {
                                    $('.shopcart-header-info').text('');
                                    $('.shopcart-info').hide();
                                    $('.shopcart-placeholder').show();
                                    options.success([]);
                                }
                            });
                            promise.fail(function () {
                                options.success([]);
                            });
                        }
                    },
                    error: function (e) {
                        console.log('Error: ', e);
                    }
                };
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        updateLine: function (orderQty) {
            app.mobileApp.showLoading();
            successUpd = function () {
                app.mobileApp.hideLoading();
                debugger;
                app.viewModels.shopcartDetViewModel.forceLoad = true;
                app.viewModels.shopcartDetViewModel.onBeforeShow();
                MessageDialogController.showMessage('Shopping cart updated successfully', "Success");
            }
            eOrderobj = new EOrderClass();
            eOrderobj.setCustId(localStorage.getItem('defaultCustomer'));
            var eoline = {
                "LocId": app.viewModels.shopcartDetViewModel.selectedRow.LocId,
                "ProdRecno": app.viewModels.shopcartDetViewModel.selectedRow.ProdRecno,
                "OrderQty": orderQty,
                "LineNo": app.viewModels.shopcartDetViewModel.selectedRow.LineNo,
                "Checksum": app.viewModels.shopcartDetViewModel.selectedRow.Checksum,
                "Rowid": app.viewModels.shopcartDetViewModel.selectedRow.Rowid
            }
            eOrderobj.addLine(eoline);
            addLineToShoppingCart(eOrderobj.getEOrder(), successUpd);
        },
        placeOrder: function () {
            app.mobileApp.showLoading();
            var promise = app.viewModels.shopcartDetViewModel.jsdoModel.invoke('FinOrder', {});
            promise.done(function (session, result, details) {
                var errors = false;
                try {
                    if (details.success)
                        errors = app.getErrors(details.response.dsOrder.dsOrder.restResult);
                    else {
                        errors = true;
                        MessageDialogController.showMessage('Placing the order failed', "Error");
                    }
                } catch (e) {
                    errors = true;
                    MessageDialogController.showMessage('Placing the order failed', "Error");
                }
                if (errors) {
                    app.mobileApp.hideLoading();
                    return;
                }
                var transNo = details.response.dsOrder.dsOrder.eOrder[0].TransNo;
                MessageDialogController.showMessage('Orcer ' + transNo + ' has been created', "Success");
                app.viewModels.shopcartDetViewModel.forceLoad = true;
                app.viewModels.shopcartDetViewModel.onBeforeShow();
                app.mobileApp.hideLoading();
            });
            promise.fail(function () {
                app.mobileApp.hideLoading();
                MessageDialogController.showMessage('Placing the order failed', "Error");
            });
        },
        shopcartNotes: function () {
            app.mobileApp.navigate('views/shopcartNotesView.html');
        }
    });
    parent.shopcartDetViewModel = shopcartDetViewModel;

})(app.viewModels);

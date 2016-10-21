(function (parent) {
    var shopcartDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Shopping Cart',
        forceLoad: false,

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

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
                                var enabledBackOrders = localStorage.getItem('EnabledBackOrders') || false;
                                if (enabledBackOrders)
                                    $(input).removeAttr('max'); //removing max attribute which initially have the AFS
                                var validator = $(form).kendoValidator({
                                    validateOnBlur: false
                                }).data('kendoValidator');
                                if (!validator.validateInput($(input)))
                                    return;
                                var orderQty = parseInt(input.val());
                                app.viewModels.shopcartDetViewModel.updateLine(orderQty);
                            }
                            else if (button.name == 'delete-line') {
                                if (confirm("Are you sure you want to delete the line?"))
                                    app.viewModels.shopcartDetViewModel.updateLine(0);
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
                            var me = this;
                            var promise = app.viewModels.shopcartDetViewModel.jsdoModel.invoke('CartRead', {});
                            promise.done(function (session, result, details) {
                                var shopcart = null;
                                if (details.response.dsOrder.dsOrder.eOrder && details.response.dsOrder.dsOrder.eOrder.length) {
                                    var shopcart = details.response.dsOrder.dsOrder.eOrder[0];
                                    if (!shopcart.eOrderLine || !shopcart.eOrderLine.length)
                                        shopcart = null;
                                }
                                if (shopcart) {
                                    $('#shopcartContainer').show();
                                    $('#shopcartPlaceholder').hide();
                                    options.success(shopcart.eOrderLine);
                                    //binding header
                                    kendo.bind($('#shopcartHeader'), shopcart, kendo.mobile.ui);
                                } else {
                                    $('#shopcartContainer').hide();
                                    $('#shopcartPlaceholder').show();
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
            var updatejsdoModel = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false,
            });
            var updateLineData = {
                "dsOrder": {
                    "eOrder": [
                        {
                            "CustId": "masroo",
                            "eOrderLine": [
                                {
                                    "LocId": app.viewModels.shopcartDetViewModel.selectedRow.LocId,
                                    "ProdRecno": app.viewModels.shopcartDetViewModel.selectedRow.ProdRecno,
                                    "OrderQty": orderQty,
                                    "LineNo": app.viewModels.shopcartDetViewModel.selectedRow.LineNo,
                                    "Checksum": app.viewModels.shopcartDetViewModel.selectedRow.Checksum,
                                    "Rowid": app.viewModels.shopcartDetViewModel.selectedRow.Rowid
                                }
                            ]
                        }
                    ]
                }
            };
            var promise = updatejsdoModel.invoke('AddOrderLine', updateLineData);
            promise.done(function (session, result, details) {
                if (details.success == true) {
                    var errors = false;
                    try {
                        errors = app.getErrors(details.response.dsOrder.dsOrder.restResult);
                    } catch (e) { }
                    if (errors)
                        return;
                    app.viewModels.shopcartDetViewModel.forceLoad = true;
                    app.viewModels.shopcartDetViewModel.onBeforeShow();
                }
            });
            promise.fail(function () {
                app.showError('Failed to update the shopping cart');
            });
        },
    });
    parent.shopcartDetViewModel = shopcartDetViewModel;

})(app.viewModels);

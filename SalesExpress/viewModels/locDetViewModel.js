(function (parent) {
    var locDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        jsdoStockModel: undefined,
        selectedRow: {},
        resourceName: 'Location Details',
        backButton: true,
        onBeforeShow: function () {
            var locDetListView = $("#locDetailView").data("kendoMobileListView");
            if (locDetListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.locDetViewModel.onInit(this);
            } else {
                locDetListView.dataSource.read();
            }

            // Set list title to resource name
            if (app.viewModels.locDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.locDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.locDetViewModel.createJSDODataSource();
                app.viewModels.locDetViewModel.createLocStockDataSource();
                app.views.locDetView = e.view;
                $("#locDetailView").kendoMobileListView({
                    dataSource: app.viewModels.locDetViewModel.jsdoDataSource,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    autoBind: false,
                    endlessScroll: false,
                    template: kendo.template($("#locDetailTemplate").html())
                });
                $("#locStockView").kendoMobileListView({
                    dataSource: app.viewModels.locDetViewModel.locStockDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    autoBind: false,
                    endlessScroll: false,
                    template: kendo.template($("#locStockTemplate").html()),
                });
            }
            catch (ex) {
                alert("Error in init locDetView: " + ex);
            }
        },
        createLocStockDataSource: function () {
            //configuring JSDO Settings
            jsdoSettings.resourceName = 'dsLoc';
            jsdoSettings.tableName = 'stockdetail';
            this.jsdoStockModel = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false,
            });
            this.locStockDataSource = {
                transport: {
                    read: function (options) {
                        if (app.viewModels.locDetViewModel.selectedRow) {
                            var filter = {
                                "pProdRecno": app.viewModels.prodDetViewModel.currentLoc["Prod-RecNo"],
                                "pLocId": app.viewModels.locDetViewModel.selectedRow.Loc_Id1 //is defined like that in the model
                            };
                            var promise = app.viewModels.locDetViewModel.jsdoStockModel.invoke('GetLocStockDetail', filter);
                            promise.done(function (session, result, details) {
                                var errors = false;
                                try {
                                    errors = app.getErrors(details.response.dsLocStockDetail.dsLocStockDetail.wsResult);
                                    if (errors) {
                                        options.success([]);
                                        return;
                                    }
                                    var currentlocStockList = details.response.dsLocStockDetail.dsLocStockDetail.stockdetail;
                                    currentlocStockList.forEach(function (stockDetail) {
                                        stockDetail.ShortDescription = stockDetail.Description.replace(
                                            ' for ' + app.viewModels.locDetViewModel.selectedRow.Name, "");
                                        stockDetail.ShortDescription = stockDetail.ShortDescription.replace(
                                            ' to ' + app.viewModels.locDetViewModel.selectedRow.Name, "");
                                    });
                                    options.success(currentlocStockList);
                                } catch (e) {
                                    options.success([]);
                                }
                            });
                            promise.fail(function () {
                                options.success([]);
                            });
                        } else
                            options.success([]);
                    }
                },
                error: function (e) {
                    alert('Error: ', e);
                }
            };
        },
        createJSDODataSource: function () {
            try {
                // create JSDO
                var eLoc = locationModel();
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsLoc';
                jsdoSettings.tableName = 'eLocation';
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.jsdoDataSource = {
                    prodrecno: null,
                    schema: {
                        model: eLoc
                    },
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            var filter = { "LocationId": app.viewModels.prodDetViewModel.currentLoc.Loc_Id };
                            var promise = app.viewModels.locDetViewModel.jsdoModel.invoke('GetLocation', filter);
                            promise.done(function (session, result, details) {
                                var currentLocList = details.response.dsLoc.dsLoc.eLocation;
                                //formatting address
                                currentLocList.forEach(function (eLocation) {
                                    eLocation.FormattedAddress = getFormattedAddress(eLocation);
                                });
                                options.success(currentLocList);
                                if (currentLocList.length)
                                    app.viewModels.locDetViewModel.set('selectedRow', currentLocList[0]);
                                else
                                    app.viewModels.locDetViewModel.set('selectedRow', undefined);
                                $("#locStockView").data("kendoMobileListView").dataSource.read();
                            });
                            promise.fail(function () {
                                options.success([]);
                            });
                        }
                    },
                    error: function (e) {
                        alert('Error: ', e);
                    }
                };
            }

            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
    });

    parent.locDetViewModel = locDetViewModel;

})(app.viewModels);


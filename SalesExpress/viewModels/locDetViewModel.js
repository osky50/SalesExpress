(function (parent) {
    var locDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        jsdoStockModel: undefined,
        selectedRow: {},
        resourceName: 'Location Details',

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

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
                console.log("Error in init locDetView: " + ex);
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
                        var me = app.viewModels.locDetViewModel;
                        var filter = {
                            "pProdRecno": app.viewModels.prodDetViewModel.currentLoc["Prod-RecNo"],
                            "pLocId": app.viewModels.prodDetViewModel.currentLoc.Loc_Id
                        };
                        var promise = me.jsdoStockModel.invoke('GetLocStockDetail', filter);
                        promise.done(function (session, result, details) {
                            var errors = false;
                            try {
                                errors = app.getErrors(details.response.dsLocStockDetail.dsLocStockDetail.wsResult);
                                if (errors)
                                    return;
                                var currentlocStockList = details.response.dsLocStockDetail.dsLocStockDetail.stockdetail;
                                options.success(currentlocStockList);
                            } catch (e) {
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
                            var me = app.viewModels.locDetViewModel;
                            var filter = { "LocationId": app.viewModels.prodDetViewModel.currentLoc.Loc_Id };
                            var promise = me.jsdoModel.invoke('GetLocation', filter);
                            promise.done(function (session, result, details) {
                                var currentLocList = details.response.dsLoc.dsLoc.eLocation;
                                options.success(currentLocList);
                                $("#locStockView").data("kendoMobileListView").dataSource.read();
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
        xxonHide() {
            app.clearData(locDetViewModel);
        },
    });

    parent.locDetViewModel = locDetViewModel;

})(app.viewModels);


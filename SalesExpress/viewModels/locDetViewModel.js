(function (parent) {
    var locDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
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
            jsdoSettings.resourceName = 'dsLocStockDetail';
            jsdoSettings.tableName = 'stockdetail';
            this.jsdoModel = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false,
            });
            this.locStockDataSource = {
                transport: {
                    read: function (options) {
                        var me = app.viewModels.locDetViewModel;
                        var filter = {"pProdrecno":app.viewModels.prodDetViewModel.selectedRow.Prod_Recno, 
                            "pLocId": app.viewModels.prodDetViewModel.selectedRow.Loc_Id
                        };
                        var promise = me.jsdoModel.invoke('GetLocationDetail', filter);
                        promise.done(function (session, result, details) {
                            var currentlocStockList = details.response.dsLocStockDetail.dsLocStockDetail.stockdetail;
                            options.success(currentlocStockList);
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
                            var filter = { "LocationId": app.viewModels.prodDetViewModel.selectedRow.Loc_Id};
                            me.jsdoDataSource.prodrecno = app.viewModels.prodListViewModel.selectedRow.Prod_Recno;
                            var promise = me.jsdoModel.invoke('GetLocation', me.jsdoDataSource.filter());
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


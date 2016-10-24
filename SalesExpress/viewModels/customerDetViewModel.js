(function (parent) {
    var customerDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Customer Details',
        forceLoad: false,
        onBeforeShow: function () {
            debugger;
            var customerDetData = $("#customerDetData").data("kendoMobileListView");
            if (customerDetData === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.customerDetViewModel.onInit(this);
            } else if (customerDetData.dataSource && customerDetData.dataSource.data().length === 0 ||
                app.viewModels.customerDetViewModel.forceLoad) {
                customerDetData.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.customerDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.customerDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                debugger;
                // Create Data Source
                app.viewModels.customerDetViewModel.createJSDODataSource();
                app.views.listView = e.view;
                // Create list
                $("#customerDetData").kendoMobileListView({
                    dataSource: app.viewModels.customerDetViewModel.jsdoDataSource,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    template: kendo.template($("#customerDetTemplate").html()),
                    click: function (e) {
                        app.viewModels.customerDetViewModel.set("selectedRow", e.dataItem);
                        if (!e.button)
                            return;
                        debugger;
                        app.viewModels.customerDetViewModel.getDirections();                        
                    }
                });
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        createJSDODataSource: function () {
            try {
                var eCustomer = kendo.data.Model.define({
                    fields: {
                        Cust_Id: {
                            type: "string", // the field is a string
                            from: "[\"Cust-Id\"]",
                        },
                    }
                });
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsCust';
                jsdoSettings.tableName = 'eCustomer';
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false
                });
                this.jsdoDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            debugger;
                            var me = this;
                            var promise = app.viewModels.customerDetViewModel.jsdoModel.invoke('GetCustomer', { "CustomerId": "masroo" });
                            promise.done(function (session, result, details) {
                                options.success(details.response.dsCust.dsCust.eCustomer);
                            });
                            promise.fail(function () {
                                options.success([]);
                            });
                        }
                    },
                    schema: {
                        model: eCustomer,
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
        getDirections: function () {
            alert('get directions');
        },
    });
    parent.customerDetViewModel = customerDetViewModel;

})(app.viewModels);

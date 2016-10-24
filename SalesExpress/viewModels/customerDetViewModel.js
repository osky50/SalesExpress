(function (parent) {
    var customerDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Customer Details',
        forceLoad: false,
        onBeforeShow: function () {
            var customerDetData = $("#customerDetData").data("kendoMobileListView");
            if (customerDetData === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.customerDetViewModel.onInit(this);
            } else if (customerDetData.dataSource.data().length === 0 || app.viewModels.customerDetViewModel.forceLoad) {
                customerDetData.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.customerDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.customerDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
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
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'change-customer')
                                app.viewModels.customerDetViewModel.changeCustomer();
                            else if (button.name == 'directions')
                                app.viewModels.customerDetViewModel.getDirections();
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
                jsdoSettings.resourceName = 'dsCust';
                jsdoSettings.tableName = 'eCustomer';
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.jsdoDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            var me = this;
                            var promise = app.viewModels.customerDetViewModel.jsdoModel.invoke(
                                'GetCustomer',
                                {
                                    "CustomerId": localStorage.getItem('defaultCustomer'),
                                });
                            promise.done(function (session, result, details) {
                                //formatting the customer address
                                for (var i = 0; i < details.response.dsCust.dsCust.eCustomer.length; i++) {
                                    var eCustomer = details.response.dsCust.dsCust.eCustomer[i];

                                    var address = eCustomer['Address'];
                                    if (eCustomer['City'] && eCustomer['City'] != '') {
                                        if (address && address != '')
                                            address = address + ', ' + eCustomer['City'];
                                        else
                                            address = eCustomer['City'];
                                    }
                                    if (eCustomer['Province'] && eCustomer['Province'] != '') {
                                        if (address && address != '')
                                            address = address + ', ' + eCustomer['Province'];
                                        else
                                            address = eCustomer['Province'];
                                    }
                                    if (eCustomer['PostalCode'] && eCustomer['PostalCode'] != '') {
                                        if (address && address != '')
                                            address = address + ', ' + eCustomer['PostalCode'];
                                        else
                                            address = eCustomer['PostalCode'];
                                    }
                                    eCustomer.FormattedAddress = address;
                                }
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
        changeCustomer: function () {
            app.mobileApp.navigate('views/customerListView.html');
        },
        getDirections: function () {
            app.mobileApp.navigate('views/customerDetMapView.html');
        },
    });
    parent.customerDetViewModel = customerDetViewModel;

})(app.viewModels);

//'use strict';

(function (parent) {
    var customerListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Customer List',
        onBeforeShow: function () {
            var customerListView = $("#customerListView").data("kendoMobileListView");
            if (customerListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.customerListViewModel.onInit(this);
            } else if (customerListView.dataSource && customerListView.dataSource.data().length === 0) {
                customerListView.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.customerListViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.customerListViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.customerListViewModel.createJSDODataSource();
                app.views.listView = e.view;
                // Create list
                $("#customerListView").kendoMobileListView({
                    dataSource: app.viewModels.customerListViewModel.jsdoDataSource,
                    autoBind: false,
                    pullToRefresh: true,
                    style: "display: inline",
                    pageable: true,
                    appendOnRefresh: false,
                    loadMore: false,
                    /*filterable: {
                        placeholder: "Type to search...",
                        field: "synonym"
                    },*/
                    virtualViewSize: 100,
                    template: kendo.template($("#customerListTemplate").html()),
                    click: function (e) {
                        app.viewModels.customerListViewModel.set("selectedRow", e.dataItem);
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'change-customer')
                                app.viewModels.customerListViewModel.changeCustomer();
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
                var eCustomer = customerModel();
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.jsdoDataSource = new kendo.data.DataSource({
                    type: "jsdo",
                    // TO_DO - Enter your filtering and sorting options
                    serverPaging: true,
                    //serverFiltering: true,
                    serverSorting: true,
                    transport: {
                        jsdo: this.jsdoModel
                        // TO_DO - If resource is multi-table dataset, specify table name for data source
                        , tableRef: jsdoSettings.tableName
                    },
                    schema: {
                        model: eCustomer,
                    },
                    error: function (e) {
                        console.log("Error: ", e);
                    }
                });
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        changeCustomer: function () {
            //checking if there is an open shopping cart
            //configuring JSDO Settings
            jsdoSettings.resourceName = 'dsOrder';
            jsdoSettings.tableName = 'eOrder';
            // create JSDO
            var shoppingCartJSDO = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false
            });
            var checkCartPromise = shoppingCartJSDO.invoke('CartRead', {});
            checkCartPromise.done(function (session, result, details) {
                var selectedCustomer = app.viewModels.customerListViewModel.selectedRow;
                if (details.response.dsOrder.dsOrder.eOrder && details.response.dsOrder.dsOrder.eOrder.length) { //there is an open shopping cart for the current user
                    var shoppingCart = details.response.dsOrder.dsOrder.eOrder[0];
                    if (shoppingCart && shoppingCart.CustId != selectedCustomer.Cust_Id) {
                        if (confirm('You already have an open shopping cart with another customer (' + shoppingCart.CustId + '). If you proceed with this action this shopping cart will be closed. Do you want to proceed?')){
                            //cancelling the current shopping cart
                            var cancelCartPromise = shoppingCartJSDO.invoke('CancelOrder', {});
                            checkCartPromise.done(function (session, result, details) {
                                if (details.success) {
                                    localStorage.setItem('defaultCustomer', selectedCustomer.Cust_Id); //changing customer in localStorage
                                    $(".customer-info").html(localStorage.getItem('defaultCustomer'));
                                    app.mobileApp.navigate('views/customerDetView.html');
                                }
                            });
                            checkCartPromise.fail(function () {
                                app.showError('Can not change customer. Existing Shopping cart could not be cancelled.');
                            });
                        }
                    }
                } else {
                    localStorage.setItem('defaultCustomer', selectedCustomer.Cust_Id); //changing customer in localStorage
                    $(".customer-info").html(localStorage.getItem('defaultCustomer'));
                    app.mobileApp.navigate('views/customerDetView.html');
                }
            });
            checkCartPromise.fail(function () {
                app.showError('Can not change customer. Shopping cart could not be checked.');
            });
        },
    });

    parent.customerListViewModel = customerListViewModel;

})(app.viewModels);

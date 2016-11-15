//'use strict';

(function (parent) {
    var customerListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        lastRowid: undefined,
        lastPage: undefined,
        fromLoadMore: false,
        moreRecords: true,
        pageSize: app.pageSize,
        loadedCust: [],
        selectedRow: {},
        origRow: {},
        resourceName: 'Customer List',
        backButton: true,
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
                    filterable: {
                        autoFilter: false,
                        placeholder: "Type to search...",
                        field: "search-alias"
                    },
                    appendOnRefresh: false,
                    loadMore: false,
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
                alert("Error in initListView: " + ex);
            }
        },
        loadMore: function () {
            var custListView = $("#customerListView").data("kendoMobileListView");
            app.viewModels.customerListViewModel.set("fromLoadMore", true);
            custListView.dataSource.read();
        },
        createJSDODataSource: function () {
            try {
                //configuring JSDO Settings
                app.jsdoSettings.resourceName = 'dsCust';
                app.jsdoSettings.tableName = 'eCustomer';
                var eCustomer = customerModel();
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: app.jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.jsdoDataSource = new kendo.data.DataSource({
                    // TO_DO - Enter your filtering and sorting options
                    serverPaging: true,
                    serverFiltering: true,
                    serverSorting: true,
                    transport: {
                        read: function (options) {
                            app.mobileApp.showLoading();
                            var me = app.viewModels.customerListViewModel;
                            if (me.fromLoadMore && me.lastRowid) {
                                options.data.startrowid = me.lastRowid;
                            }
                            options.data.pageSize = me.pageSize;
                            var rparam = JSON.stringify(options.data);
                            var promise = me.jsdoModel.read(rparam);
                            promise.done(function (session, result, details) {
                                var currentCustList = details.response.dsCust.eCustomer || [];
                                currentCustList.forEach(function (eCustomer) {
                                    eCustomer['Cust-Id'] = eCustomer['Cust-Id'] || '<not specified>';
                                });
                                if (currentCustList && currentCustList.length > 0) {
                                    me.set("lastRowid", currentCustList[currentCustList.length - 1].TextRowID);
                                    me.set("moreRecords", currentCustList.length === me.pageSize);
                                }
                                else {
                                    me.set("moreRecords", false);
                                }
                                kendo.bind($("#loadMore"), me);
                                if (me.fromLoadMore) {
                                    me.set("fromLoadMore", false);
                                }
                                else {
                                    me.loadedCust = [];
                                }
                                Array.prototype.push.apply(me.loadedCust, currentCustList);
                                options.success(me.loadedCust.slice());
                                app.mobileApp.hideLoading();
                            });
                            promise.fail(function () {
                                options.success([]);
                                app.mobileApp.hideLoading();
                            });
                        }
                    },
                    schema: {
                        model: eCustomer,
                    },
                    error: function (e) {
                        alert("Error: ", e);
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
            app.jsdoSettings.resourceName = 'dsOrder';
            app.jsdoSettings.tableName = 'eOrder';
            // create JSDO
            var shoppingCartJSDO = new progress.data.JSDO({
                name: app.jsdoSettings.resourceName,
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
                                    app.navigate('views/customerDetView.html');
                                }
                            });
                            checkCartPromise.fail(function () {
                                MessageDialogController.showMessage('Can not change customer: existing Shopping cart could not be cancelled', "Error");
                            });
                        }
                    }
                } else {
                    localStorage.setItem('defaultCustomer', selectedCustomer.Cust_Id); //changing customer in localStorage
                    $(".customer-info").html(localStorage.getItem('defaultCustomer'));
                    app.navigate('views/customerDetView.html');
                }
            });
            checkCartPromise.fail(function () {
                MessageDialogController.showMessage('Can not change customer: shopping cart could not be checked', "Error");
            });
        },
    });

    parent.customerListViewModel = customerListViewModel;

})(app.viewModels);

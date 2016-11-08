//'use strict';

(function (parent) {
    var orderListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Order List',

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

        onBeforeShow: function () {
            var orderListView = $("#orderListView").data("kendoMobileListView");
            if (orderListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.orderListViewModel.onInit(this);
            } else if (orderListView.dataSource && orderListView.dataSource.data().length === 0) {
                orderListView.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.orderListViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.orderListViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.orderListViewModel.createJSDODataSource();
                app.views.listView = e.view;
                // Create list
                $("#orderListView").kendoMobileListView({
                    dataSource: app.viewModels.orderListViewModel.jsdoDataSource,
                    autoBind: false,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: true,
                    virtualViewSize: 100,
                    template: kendo.template($("#orderTemplate").html()),
                    click: function (e) {
                        app.viewModels.orderListViewModel.set("selectedRow", e.dataItem);
                    }
                });
            }
            catch (ex) {
                alert("Error in initListView: " + ex);
            }
        },
        createJSDODataSource: function () {
            try {
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsOrder';
                jsdoSettings.tableName = 'eOrder';
                // create JSDO
                if (jsdoSettings && jsdoSettings.resourceName) {
                    this.jsdoModel = new progress.data.JSDO({
                        name: jsdoSettings.resourceName,
                        autoFill: false, events: {
                            'afterFill': [{
                                scope: this,
                                fn: function (jsdo, success, request) {
                                    // afterFill event handler statements ...
                                }
                            }],
                            'beforeFill': [{
                                scope: this,
                                fn: function (jsdo, success, request) {
                                    // beforeFill event handler statements ...
                                }
                            }]
                        }
                    });
                    this.jsdoDataSource = new kendo.data.DataSource({
                        data: [],
                        error: function (e) {
                            alert("Error: ", e);
                        },
                    });
                    //adding custom methods
                    var me = this;
                    this.jsdoDataSource.read = function () {
                        var promise = me.jsdoModel.invoke('OrderList', { "CustomerId": localStorage.getItem('defaultCustomer') });
                        promise.done(function (session, result, details) {
                            me.jsdoDataSource.data(details.response.dsOrder.dsOrder.eOrder);
                        });
                    }
                }
                else {
                    alert("Warning: jsdoSettings.resourceName not specified");
                }
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
    });

    parent.orderListViewModel = orderListViewModel;

})(app.viewModels);

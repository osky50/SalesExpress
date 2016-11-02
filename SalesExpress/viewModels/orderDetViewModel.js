//'use strict';

(function (parent) {
    var orderDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Order Details',
        backButton: true,
        onBeforeShow: function () {
            var orderLines = $("#orderLines").data("kendoMobileListView");
            if (orderLines === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.orderDetViewModel.onInit(this);
            } else {
                orderLines.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.orderDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.orderDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.orderDetViewModel.createJSDODataSource();
                app.views.listView = e.view;
                // Create list
                $("#orderLines").kendoMobileListView({
                    dataSource: app.viewModels.orderDetViewModel.jsdoDataSource,
                    autoBind: false,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    virtualViewSize: 100,
                    template: kendo.template($("#orderLineTemplate").html())
                });
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        createJSDODataSource: function () {
            try {
                this.jsdoDataSource = new kendo.data.DataSource({
                    data: [],
                    error: function (e) {
                        console.log("Error: ", e);
                    },
                });
                //adding custom methods
                var me = this;
                this.jsdoDataSource.read = function () {
                    //binding header
                    kendo.bind($('#orderHeader'), app.viewModels.orderListViewModel.selectedRow, kendo.mobile.ui);
                    //binding lines
                    me.jsdoDataSource.data(app.viewModels.orderListViewModel.selectedRow.eOrderLine);
                }
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
    });

    parent.orderDetViewModel = orderDetViewModel;

})(app.viewModels);

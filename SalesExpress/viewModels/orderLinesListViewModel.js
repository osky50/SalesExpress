//'use strict';

(function (parent) {
    var orderLinesListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Order Lines',
        kendoListView: null,

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

        onBeforeShow: function () {
            var orderLinesListView = $("#orderLinesListView").data("kendoMobileListView");
            if (orderLinesListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.orderLinesListViewModel.onInit(this);
            } else {
                orderLinesListView.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.orderLinesListViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.orderLinesListViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.orderLinesListViewModel.createJSDODataSource();
                app.views.listView = e.view;
                // Create list
                $("#orderLinesListView").kendoMobileListView({
                    dataSource: app.viewModels.orderLinesListViewModel.jsdoDataSource,
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
                    me.jsdoDataSource.data(app.viewModels.orderListViewModel.selectedRow.eOrderLine);
                }
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
    });

    parent.orderLinesListViewModel = orderLinesListViewModel;

})(app.viewModels);

//'use strict';

(function (parent) {
    var prodListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Product List',

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

        onBeforeShow: function () {
            var prodListView = $("#mainListView").data("kendoMobileListView");
            if (prodListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.prodListViewModel.onInit(this);
            } else if (prodListView.dataSource && prodListView.dataSource.data().length === 0) {
                prodListView.dataSource.read();
            }

            // Set list title to resource name
            if (app.viewModels.prodListViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.prodListViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.prodListViewModel.createJSDODataSource();
                app.views.listView = e.view;
                // Create list
                $("#mainListView").kendoMobileListView({
                    dataSource: app.viewModels.prodListViewModel.jsdoDataSource,
                    autoBind: false,
                    pullToRefresh: true,
                    style: "display: inline",
                    pageable: true,
                    appendOnRefresh: false,
                    loadMore: false,
                    filterable: {
                        autoFilter: false,
                        placeholder: "Type to search...",
                        field: "synonym"
                    },
                    virtualViewSize: 100,
                    template: kendo.template($("#prodTemplate").html()),
                    click: function (e) {
                        // console.log("e.dataItem._id " + e.dataItem._id);
                        app.viewModels.prodListViewModel.set("selectedRow", e.dataItem);
                    },
                    dataBound: function (e) {
                        $('.rateit').each(function (index, element) {
                            var ratingValue = parseFloat(element.getAttribute('rating-value'));
                            var ratingStep = parseFloat(element.getAttribute('step'));
                            var elementObj = $(element);
                            elementObj.rateit();
                            elementObj.rateit('value', ratingValue);
                            elementObj.rateit('step', ratingStep);
                        });
                    }
                });
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        createJSDODataSource: function () {
            try {
                var eProduct = kendo.data.Model.define({
                    id: "id", // the identifier is the "id" field (declared below)
                    fields: {
                        Prod_Id: {
                            type: "string", // the field is a string
                            validation: { // validation rules
                                required: true // the field is required
                            },
                            from: "[\"Product-Id\"]",
                            defaultValue: "<empty>" // default field value

                        },
                        Prod_Recno: {
                            type: "string", // the field is a string
                            validation: { // validation rules
                                required: true // the field is required
                            },
                            from: "[\"Prod-RecNo\"]",
                            defaultValue: "<empty>" // default field value

                        }
                    }
                });
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsProd';
                jsdoSettings.tableName = 'eProduct';
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false, events: {
                        'afterFill': [{
                            scope: this,
                            fn: function (jsdo, success, request) {                               
                            }
                        }],
                        'beforeFill': [{
                            scope: this,
                            fn: function (jsdo, success, request) {
                                // beforeFill event handler statements ...
                            }
                        }],
                    }
                });
                this.jsdoDataSource = new kendo.data.DataSource({
                    type: "jsdo",
                    // TO_DO - Enter your filtering and sorting options
                    serverPaging: true,
                    serverFiltering: true,
                    serverSorting: true,
                    //filter: { field: "synonym", operator: "contains", value: "MA" },
                    //sort: [ { field: "Name", dir: "desc" } ],
                    pageSize: 17,
                    transport: {
                        jsdo: this.jsdoModel
                        // TO_DO - If resource is multi-table dataset, specify table name for data source
                        , tableRef: jsdoSettings.tableName
                    },
                    schema: {
                        model: eProduct,
                        total: function () { return 500; }
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
    });

    parent.prodListViewModel = prodListViewModel;

})(app.viewModels);

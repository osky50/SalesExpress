//'use strict';

(function (parent) {
    var productViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: undefined,

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show
        onBeforeShowProdDet: function () {
            debugger;
            app.viewModels.productViewModel.createJSDODataSource();


        },
        onBeforeShow: function () {
            
            var clistView;
            debugger;
            //return;
            clistView = $("#mainListView").data("kendoMobileListView");
            //if (clistView === undefined) {
            //    app.viewModels.productViewModel.onInit(this);
            //} else if (clistView.dataSource && clistView.dataSource.data().length === 0) {
            //    clistView.dataSource.read();
            //}
            clistView.dataSource.read();
            // Set list title to resource name
            if (app.viewModels.productViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.productViewModel.resourceName);
            }
        },
        onInit: function (e) {
            debugger;
            if (e.view.inited) return;
            try {
                // Create Data Source
                debugger;
                app.viewModels.productViewModel.createJSDODataSource();
                app.views.listView = e.view;

                // Create list
                if (jsdoSettings && jsdoSettings.displayFields) {
                    $("#mainListView").kendoMobileListView({
                        dataSource: app.viewModels.productViewModel.jsdoDataSource,
                        autoBind: false,
                        pullToRefresh: true,
                        style: "display: inline",
                        appendOnRefresh: false,
                        endlessScroll: true,
                        filterable: {
                            placeholder: "Type to search...",
                            field: "synonym"
                        },
                        virtualViewSize: 100,
                        template: kendo.template($("#prodTemplate").html()),

                        click: function (e) {
                            // console.log("e.dataItem._id " + e.dataItem._id);
                            app.viewModels.productViewModel.set("selectedRow", e.dataItem);
                        }
                    });
                }
                else {
                    console.log("Warning: jsdoSettings.displayFields not specified");
                }
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },

        createJSDODataSource: function () {
            try {
                // create JSDO
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
                                    debugger;
                                    // beforeFill event handler statements ...
                                }
                            }]
                        }
                    });
                    this.jsdoDataSource = new kendo.data.DataSource({
                        type: "jsdo",
                        // TO_DO - Enter your filtering and sorting options
                        serverFiltering: true,
                        //serverSorting: true,
                        //filter: { field: "State", operator: "startswith", value: "MA" },
                        //sort: [ { field: "Name", dir: "desc" } ],
                        transport: {
                            jsdo: this.jsdoModel
                            // TO_DO - If resource is multi-table dataset, specify table name for data source
                            , tableRef: jsdoSettings.tableName
                        },
                        schema: {
                            model: eProduct
                        },
                        error: function (e) {
                            console.log("Error: ", e);
                        }
                    });
                    this.resourceName = jsdoSettings.resourceName;
                }
                else {
                    console.log("Warning: jsdoSettings.resourceName not specified");
                }
            }
            catch (ex) {
                app.viewModels.productViewModel.createDataSourceErrorFn({ errorObject: ex });
            }
        },

        createDataSourceErrorFn: function (info) {
            var msg = "Error on create DataSource";
            app.showError(msg);
            if (info.errorObject !== undefined) {
                msg = msg + "\n" + info.errorObject;
            }
            console.log(msg);
        },

        clearData: function () {
            var that = this,
                clistView;
            //that.jsdoModel = undefined;
            //that.jsdoDataSource = undefined;
            if (that.jsdoModel) {
                that.jsdoModel.addRecords([], progress.data.JSDO.MODE_EMPTY);
            }
            clistView = $("#mainListView").data("kendoMobileListView");
            if (clistView && clistView.dataSource) {
                // Clear ListView
                clistView.dataSource.data([]);
                clistView.refresh();
            }
        }

    });

    parent.productViewModel = productViewModel;

})(app.viewModels);

(function (parent) {
    var prodDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: undefined,

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

        onBeforeShow: function () {
            var location = window.location.toString();
            var predrecno = location.substring(location.lastIndexOf('?') + 4);
            app.viewModels.prodDetViewModel.jsdoDataSource.filter({ field: "Prod-RecNo", operator: "eq", value: predrecno });
            var currentProd = app.viewModels.prodDetViewModel.jsdoDataSource.data.view()[0];
            kendo.bind($('#prodDetail'), currentProd, kendo.mobile.ui);
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.prodDetViewModel.createJSDODataSource();
                app.views.productDetView = e.view;
            }
            catch (ex) {
                console.log("Error in initproductDetView: " + ex);
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
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsProd';
                jsdoSettings.tableName = 'eProduct';
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
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        onHide() {
            this.jsdoDataSource.filter({});
        },
    });

    parent.prodDetViewModel = prodDetViewModel;

})(app.viewModels);


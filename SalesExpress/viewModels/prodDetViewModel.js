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
            debugger;
            app.viewModels.prodDetViewModel.jsdoDataSource.filter({ field: "Prod-RecNo", operator: "eq", value: predrecno });
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
                        data: [],
                        serverFiltering: true,
                        schema: {
                            model: eProduct
                        },
                        error: function (e) {
                            console.log("Error: ", e);
                        },
                    });
                    //adding custom methods
                    var me = this;
                    this.jsdoDataSource.read = function () {
                        debugger;
                        var promisse
                        var filter = me.jsdoDataSource.filter();
                        promisse = me.jsdoModel.invoke('ProductDetail', { ProdRecno: filter.filters[0].value, CustId: "masroo" });
                        promisse.done(function (session, result, details) {
                            var currentProdList = details.response.dsProd.dsProd.eProduct;
                            me.jsdoDataSource.data(currentProdList);
                            if (currentProdList && currentProdList.length > 0) {
                                kendo.bind($('#prodDetail'), currentProdList[0], kendo.mobile.ui);
                            }
                        });
                    }
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
            app.clearData(prodDetViewModel);
        },
    });

    parent.prodDetViewModel = prodDetViewModel;

})(app.viewModels);


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
            var prodDetListView = $("#prodDetailView").data("kendoMobileListView");
            if (prodDetListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.prodDetListViewModel.onInit(this);
            } else if (prodDetListView.dataSource && prodDetListView.dataSource.data().length === 0) {
                prodDetListView.dataSource.read();
            }

            // Set list title to resource name
            if (app.viewModels.prodDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.prodDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.prodDetViewModel.createJSDODataSource();
                app.viewModels.prodDetViewModel.createProdLocDataSource();

                app.views.productDetView = e.view;
                $("#prodDetailView").kendoMobileListView({
                    dataSource: app.viewModels.prodDetViewModel.jsdoDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    template: kendo.template($("#prodDetailTemplate").html())
                });

                $("#prodDetailLocView").kendoMobileListView({
                    dataSource: app.viewModels.prodDetViewModel.prodLocDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    template: kendo.template($("#prodDetLocTemplate").html())
                });
            }
            catch (ex) {
                console.log("Error in initproductDetView: " + ex);
            }
        },
        createProdLocDataSource: function () {
            var eLoc = kendo.data.Model.define({
                id: "id", // the identifier is the "id" field (declared below)
                fields: {
                    Loc_Id: {
                        type: "string", // the field is a string
                        validation: { // validation rules
                            required: true // the field is required
                        },
                        from: "[\"Loc-id\"]",
                        defaultValue: "<empty>" // default field value

                    }
                }
            });
            this.prodLocDataSource = new kendo.data.DataSource({
                schema: {
                    model: eLoc,
                    parse: function (response) {
                        debbuger;
                        for (var i = 0; i < response.length; i++) {
                            el = response[i];
                            el.Loc_Id = el["Loc-id"];
                            delete el["Loc-id"];
                        }
                        return response;
                    }
                },
                data: [],
                error: function (e) {
                    console.log('Error: ', e);
                }
            });
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
                    this.jsdoDataSource = {
                        prodrecno: null,
                        schema: {
                            model: eProduct
                        },
                        custid: "masroo",
                        filter: function () {
                            var f = {};
                            if (this.prodrecno) {
                                f.ProdRecno = this.prodrecno;
                            }
                            if (this.custid) {
                                f.CustId = this.custid;
                            }
                            return f;
                        },
                        transport: {
                            // when the grid tries to read data, it will call this function
                            read: function (options) {
                                var me = app.viewModels.prodDetViewModel;
                                var location = window.location.toString();
                                me.jsdoDataSource.prodrecno = location.substring(location.lastIndexOf('?') + 4);
                                var promise = me.jsdoModel.invoke('ProductDetail', me.jsdoDataSource.filter());
                                promise.done(function (session, result, details) {
                                    var currentProdList = details.response.dsProd.dsProd.eProduct;
                                    options.success(currentProdList);
                                    //assigning location list data
                                    $("#prodDetailLocView").data("kendoMobileListView").dataSource.data(details.response.dsProd.dsProd.eProductLoc)
                                });
                                promise.fail(function () {
                                    options.success([]);
                                });
                            }
                        },
                        error: function (e) {
                            console.log('Error: ', e);
                        }
                    };
                }
                else {
                    console.log("Warning: jsdoSettings.resourceName not specified");
                }

            }

            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        xxonHide() {
            app.clearData(prodDetViewModel);
        },
    });

    parent.prodDetViewModel = prodDetViewModel;

})(app.viewModels);


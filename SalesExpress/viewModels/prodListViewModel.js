//'use strict';

(function (parent) {
    var prodListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        jsdoReviewsModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Product List',
        forceLoad: false,

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

        onBeforeShow: function () {
            var prodListView = $("#productListView").data("kendoMobileListView");
            if (prodListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.prodListViewModel.onInit(this);
            } else if (prodListView.dataSource && prodListView.dataSource.data().length === 0 || app.viewModels.prodListViewModel.forceLoad) {
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
                app.viewModels.prodListViewModel.createProdReviewsJSDO();
                app.views.listView = e.view;
                // Create list
                $("#productListView").kendoMobileListView({
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
                        app.viewModels.prodListViewModel.set("selectedRow", e.dataItem);
                        if (!e.button) {
                            app.mobileApp.navigate('views/prodDetView.html');
                            return;
                        }
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'reviews-link') {
                                app.mobileApp.navigate('views/prodDetReviewsView.html');
                                return;
                            } else if (button.name == 'create-review-link')
                                return;
                        } catch (e) { }
                    },
                    dataBound: function (e) {
                        scriptsUtils.createRatingsComponent('prod-list-rateit');
                    }
                });
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        createJSDODataSource: function () {
            try {
                var eProduct = productModel();
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
        createProdReviewsJSDO: function () {
            //configuring JSDO Settings
            jsdoSettings.resourceName = 'dsProd';
            jsdoSettings.tableName = 'ProdReview';
            this.jsdoReviewsModel = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false,
            });
        },
        addReview: function (e, successCallback) {
            try {
                var form = e.sender.element[0].parentNode;
                var validator = $(form).kendoValidator({
                    validateOnBlur: false
                }).data('kendoValidator');
                if (!validator.validate())
                    return;
                var rating = scriptsUtils.getRatingValue('.create-review-rateit', 32);
                if (rating == 0)
                    rating = 1;
                var prodReviewDet = {
                    "Prod_recno": app.viewModels.prodListViewModel.selectedRow.Prod_Recno,
                    "cust_id": localStorage.getItem('selectedCustomer'),
                    "rating": rating,
                    "recommended": form.recommended.value == 'on' ? 'yes' : 'no',
                    "review_text": form.comments.value,
                    "web_user_id": app.viewModels.loginViewModel.username
                };
                var request = {
                    "dsProdReview": {
                        "ProdReview": [
                            {
                                "ProdReviewDet": [prodReviewDet]
                            }
                        ]
                    }
                };
                var promise = app.viewModels.prodListViewModel.jsdoReviewsModel.invoke(
                    'AddProdReview', request);
                promise.done(function (session, result, details) {
                    var errors = false;
                    try {
                        if (details.success)
                            errors = app.getErrors(details.response.dsProdReview.dsProdReview.wsReviewResult);
                        else {
                            errors = true;
                            app.showMessage('Adding the review failed.');
                        }
                    } catch (e) {
                        errors = true;
                        app.showMessage('Adding the review failed.');
                    }
                    if (errors)
                        return;
                    var callback = app.reviewScreen.callback; //taking callback before closing the screen
                    app.reviewScreen.close();
                    if (callback) {
                        try {
                            callback(prodReviewDet);
                        } catch (e) { }
                    }
                });
                promise.fail(function () {
                    app.showMessage('Adding the review failed.');
                });
            } catch (e) { }
        },
        closeReview: function () {
            $('#create_review').getKendoMobileModalView().close();
        },
        addReviewCallback: function (prodReviewDet) {
            app.viewModels.prodListViewModel.forceLoad = true;
            app.viewModels.prodListViewModel.onBeforeShow();
            app.showMessage('Thanks for giving us your opinion.')
        },
    });

    parent.prodListViewModel = prodListViewModel;

})(app.viewModels);

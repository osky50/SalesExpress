//'use strict';

(function (parent) {
    var prodListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        lastRowid: undefined,
        lastPage: undefined,
        fromLoadMore: false,
        moreRecords: true,
        pageSize: 3,
        loadedProduct: [],
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
                app.views.listView = e.view;
                // Create list
                $("#productListView").kendoMobileListView({
                    dataSource: app.viewModels.prodListViewModel.jsdoDataSource,
                    autoBind: false,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    loadMore: false,
                    filterable: {
                        autoFilter: false,
                        placeholder: "Type to search...",
                        field: "synonym"
                    },
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
                            } else if (button.name == 'create-review-link') {
                                var addReviewCallback = function (prodReviewDet) {
                                    app.viewModels.prodListViewModel.forceLoad = true;
                                    app.back();
                                };
                                app.viewModels.prodAddReviewViewModel.set("selectedProduct", e.dataItem);
                                app.viewModels.prodAddReviewViewModel.successCallback = addReviewCallback;
                                app.mobileApp.navigate('views/prodAddReviewView.html');
                            } else if (button.name == 'addToCart') {
                                app.viewModels.prodListViewModel.addLineToCart();
                            }
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
        loadMore: function () {
            var prodListView = $("#productListView").data("kendoMobileListView");
            app.viewModels.prodListViewModel.set("fromLoadMore", true);
            prodListView.dataSource.read();
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
                                try {
                                    request.response.dsProd.eProduct.forEach(function (eProduct) {
                                        eProduct.BuyDisabled = eProduct.DefaultAfs == 0 ? 'disabled' : '';
                                    });
                                } catch (e) {

                                }
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
                    // TO_DO - Enter your filtering and sorting options
                    serverPaging: false,
                    serverFiltering: true,
                    serverSorting: false,
                    //filter: { field: "synonym", operator: "contains", value: "MA" },
                    //sort: [ { field: "Name", dir: "desc" } ],
                    transport: {
                        read: function (options) {
                            app.mobileApp.showLoading();
                            var me = app.viewModels.prodListViewModel;
                            //if (me.lastPage === options.data.page) {
                            //    options.success([]);
                            //    return;
                            //};
                            if (me.fromLoadMore && me.lastRowid) {
                                options.data.startrowid = me.lastRowid;
                            }
                            //Adding more parameters
                            var custid = localStorage.getItem('defaultCustomer');
                            if (custid) {
                                options.data.custid = custid;
                            }
                            options.data.pageSize = me.pageSize;
                            var rparam = JSON.stringify(options.data);
                            var promise = me.jsdoModel.read(rparam);
                            promise.done(function (session, result, details) {
                                var currentProdList = details.response.dsProd.eProduct;
                                if (currentProdList && currentProdList.length > 0) {
                                    me.set("lastRowid", currentProdList[currentProdList.length - 1].TextRowID);
                                    me.set("moreRecords", currentProdList.length === me.pageSize);
                                }
                                else {
                                    me.set("moreRecords", false);
                                }

                                kendo.bind($("#loadMore"), me);

                                if (me.fromLoadMore) {
                                    me.set("fromLoadMore", false);
                                }
                                else {
                                    me.loadedProduct = [];
                                }
                                Array.prototype.push.apply(me.loadedProduct, currentProdList);
                                options.success(me.loadedProduct.slice());
                                app.mobileApp.hideLoading();
                            });
                            promise.fail(function () {
                                options.success([]);
                                app.mobileApp.hideLoading();
                            });
                        }
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
        addLineToCart: function () {
            app.mobileApp.showLoading();
            lineAdded = function () {
                app.mobileApp.hideLoading();
                app.showMessage('Product Added to the Cart');
            };
            eOrderobj = new EOrderClass();
            eOrderobj.setCustId(localStorage.getItem('defaultCustomer'));
            var eoline = {
                "ProdRecno": app.viewModels.prodListViewModel.selectedRow.Prod_Recno,
                "OrderQty": 1,
                "LineNo": 1,
                "LocId": localStorage.getItem('defaultLocation')
            }
            eOrderobj.addLine(eoline);
            addLineToShoppingCart(eOrderobj.getEOrder(), lineAdded);
        },
    });

    parent.prodListViewModel = prodListViewModel;

})(app.viewModels);

//'use strict';

(function (parent) {
    var prodListViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        lastRowid: undefined,
        lastPage: undefined,
        fromLoadMore: false,
        moreRecords: true,
        pageSize: app.pageSize,
        loadedProduct: [],
        selectedRow: {},
        origRow: {},
        resourceName: 'Product List',
        forceLoad: false,
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
                        if (!e.button)
                            return;
                        app.viewModels.prodListViewModel.set("selectedRow", e.dataItem);
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'details') {
                                app.mobileApp.navigate('views/prodDetView.html');
                            } else if (button.name == 'reviews-link') {
                                app.mobileApp.navigate('views/prodDetReviewsView.html');
                            } else if (button.name == 'create-review-link') {
                                var addReviewCallback = function (prodReviewDet) {
                                    app.viewModels.prodListViewModel.forceLoad = true;
                                    app.back();
                                };
                                app.viewModels.prodAddReviewViewModel.set("selectedProduct", e.dataItem);
                                app.viewModels.prodAddReviewViewModel.successCallback = addReviewCallback;
                                app.mobileApp.navigate('views/prodAddReviewView.html');
                            } else if (button.name == 'addToCart') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                //analizing "enabledBackOrders" parameter
                                var enabledBackOrders = localStorage.getItem('enabledBackOrder') || false;
                                if (!enabledBackOrders || enabledBackOrders == 'false') {
                                    $(input).attr('max', app.viewModels.prodListViewModel.selectedRow.DefaultAfs); //removing max attribute which initially have the AFS
                                }
                                var validator = $(form).kendoValidator({
                                    validateOnBlur: false
                                }).data('kendoValidator');
                                if (!validator.validateInput($(input)))
                                    return;
                                var qty = parseInt(input.val());
                                app.viewModels.prodListViewModel.addLineToCart(qty);
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
                                        var enableBackOrder = localStorage.getItem('enabledBackOrder').toString();
                                        eProduct.BuyDisplay = eProduct.DefaultAfs == 0 && localStorage.getItem('enabledBackOrder') == 'false' ? 'none' : 'visible';
                                        eProduct.ShopCartIndicatorDisplay = eProduct.CartQty > 0 ? 'visible' : 'none';
                                    });
                                } catch (e) {

                                }
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
        addLineToCart: function (qty) {
            app.mobileApp.showLoading();
            lineAdded = function () {
                app.mobileApp.hideLoading();
                app.updateShoppingCartQty();
                app.viewModels.prodListViewModel.forceLoad = true;
                app.viewModels.prodListViewModel.onBeforeShow();
                VibrationController.vibrate();
            };
            eOrderobj = new EOrderClass();
            eOrderobj.setCustId(localStorage.getItem('defaultCustomer'));
            var eoline = {
                "ProdRecno": app.viewModels.prodListViewModel.selectedRow.Prod_Recno,
                "OrderQty": qty,
                "LineNo": 1,
                "LocId": localStorage.getItem('defaultLocation')
            }
            eOrderobj.addLine(eoline);
            addLineToShoppingCart(eOrderobj.getEOrder(), lineAdded);
        },
    });

    parent.prodListViewModel = prodListViewModel;

})(app.viewModels);

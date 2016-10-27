(function (parent) {
    var prodDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        currentLoc: undefined,
        selectedRow: {},
        prodLocList: [],
        origRow: {},
        resourceName: 'Product Details',
        onBeforeShow: function () {
            var prodDetListView = $("#prodDetailView").data("kendoMobileListView");
            if (prodDetListView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.prodDetViewModel.onInit(this);
            } else {
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
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    autoBind: false,
                    endlessScroll: false,
                    template: kendo.template($("#prodDetailTemplate").html()),
                    click: function (e) {
                        app.viewModels.prodDetViewModel.set("selectedRow", e.dataItem);
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'reviews-link') {
                                app.mobileApp.navigate('views/prodDetReviewsView.html');
                            }
                        } catch (e) { }
                    },
                    dataBound: function (e) {
                        scriptsUtils.createRatingsComponent('prod-det-rateit');
                    }
                });
                $("#prodDetailLocView").kendoMobileListView({
                    dataSource: app.viewModels.prodDetViewModel.prodLocDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    autoBind: false,
                    endlessScroll: false,
                    template: kendo.template($("#prodDetLocTemplate").html()),
                    click: function (e) {
                        app.viewModels.prodDetViewModel.set("selectedRow", e.dataItem);
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'addToCart') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                //analizing "enabledBackOrders" parameter
                                var enabledBackOrders = localStorage.getItem('enabledBackOrder') || false;
                                if (enabledBackOrders)
                                    $(input).removeAttr('max'); //removing max attribute which initially have the AFS
                                var validator = $(form).kendoValidator({
                                    validateOnBlur: false
                                }).data('kendoValidator');
                                if (!validator.validateInput($(input)))
                                    return;
                                var cartQty = parseInt(input.val());
                                app.viewModels.prodDetViewModel.addLineToCart(cartQty);
                            }
                            if (button.name == 'locDetails') {
                                app.viewModels.prodDetViewModel.set("currentLoc", e.dataItem);
                                app.mobileApp.navigate('views/locDetView.html');
                            }
                        } catch (e) { console.log('Error: ', e); }
                    }
                });
            }
            catch (ex) {
                console.log("Error in initproductDetView: " + ex);
            }
        },
        addLineToCart: function (qty) {
            lineAdded = function () {
                app.showMessage('Product Added to the Cart');
            };
            eOrderobj = new EOrderClass();
            eOrderobj.setCustId(localStorage.getItem('defaultCustomer'));
            var eoline = {
                "ProdRecno": app.viewModels.prodDetViewModel.jsdoDataSource.prodrecno,
                "OrderQty": qty,
                "LineNo": 1,
                "LocId": app.viewModels.prodDetViewModel.selectedRow.Loc_Id
            }
            eOrderobj.addLine(eoline);
            addLineToShoppingCart(eOrderobj.getEOrder(), lineAdded);
        },
        createProdLocDataSource: function () {
            var eLoc = locationModel();
            this.prodLocDataSource = {
                schema: {
                    model: eLoc,
                },
                transport: {
                    read: function (options) {
                        options.success(app.viewModels.prodDetViewModel.prodLocList);
                    }
                },
                error: function (e) {
                    console.log('Error: ', e);
                }
            };
        },
        createJSDODataSource: function () {
            try {
                // create JSDO
                var eProduct = productModel();
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsProd';
                jsdoSettings.tableName = 'eProduct';
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.jsdoDataSource = {
                    prodrecno: null,
                    schema: {
                        model: eProduct
                    },
                    custid: localStorage.getItem('defaultCustomer') || false,
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
                            me.jsdoDataSource.prodrecno = app.viewModels.prodListViewModel.selectedRow.Prod_Recno;
                            var promise = me.jsdoModel.invoke('ProductDetail', me.jsdoDataSource.filter());
                            promise.done(function (session, result, details) {
                                var currentProdList = details.response.dsProd.dsProd.eProduct;
                                options.success(currentProdList);
                                //rendering images list data
                                var imagesHtml = '';
                                var template = kendo.template($("#prodDetImageTemplate").html());
                                details.response.dsProd.dsProd.eProductImg.forEach(function (img) {
                                    imagesHtml += template(img); //applying template
                                });
                                $("#prodDetailImageView").html(imagesHtml); //display the result
                                $('.swipebox').swipebox();
                                //assigning location list data
                                app.viewModels.prodDetViewModel.set("prodLocList", details.response.dsProd.dsProd.eProductLoc);
                                $("#prodDetailLocView").data("kendoMobileListView").dataSource.read();
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

            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        addReviewCallback: function (prodReviewDet) {
            app.viewModels.prodDetViewModel.onBeforeShow();
            app.showMessage('Thanks for giving us your opinion.')
        },
    });

    parent.prodDetViewModel = prodDetViewModel;

})(app.viewModels);


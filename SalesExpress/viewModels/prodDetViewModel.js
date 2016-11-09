(function (parent) {
    var prodDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        prodLocDataSource: undefined,
        prodImageDataSource: undefined,
        jsdoModel: undefined,
        currentLoc: undefined,
        selectedRow: {},
        prodImageList: [],
        prodLocList: [],
        origRow: {},
        resourceName: 'Product Details',
        backButton: true,
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
                app.viewModels.prodDetViewModel.createNotesDataSource();
                app.viewModels.prodDetViewModel.createProdImageDataSource();
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
                                app.navigate('views/prodDetReviewsView.html');
                            } else if (button.name == 'create-review-link') {
                                var addReviewCallback = function (prodReviewDet) {
                                    app.back();
                                };
                                app.viewModels.prodAddReviewViewModel.set("selectedProduct", e.dataItem);
                                app.viewModels.prodAddReviewViewModel.successCallback = addReviewCallback;
                                app.navigate('views/prodAddReviewView.html');
                            }
                        } catch (e) { }
                    },
                    dataBound: function (e) {
                        scriptsUtils.createRatingsComponent('prod-det-rateit');
                    }
                });
                $("#prodNotes").kendoMobileListView({
                    dataSource: app.viewModels.prodDetViewModel.notesDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    autoBind: false,
                    template: kendo.template($("#prodNoteTemplate").html()),
                });
                $("#prodDetailImageView").kendoMobileListView({
                    dataSource: app.viewModels.prodDetViewModel.prodImageDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    autoBind: false,
                    endlessScroll: false,
                    template: kendo.template($("#prodDetImageTemplate").html()),
                    click: function (e) {
                        $("#imagePopup img").attr('src', $(e.item).find("img").attr('src'));
                        $("#imagePopup img").attr('alt', $(e.item).find("img").attr('alt'));
                        $("#imagePopup").data("kendoMobileModalView").open();
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
                                if (!enabledBackOrders || enabledBackOrders == 'false') {
                                    $(input).attr('max', app.viewModels.prodDetViewModel.selectedRow.AFS); //removing max attribute which initially have the AFS
                                }
                                var validator = $(form).kendoValidator({
                                    validateOnBlur: false,
                                    messages: {
                                        min: function (input) {
                                            return input[0].name + ' should be greater than 0';
                                        }
                                    }
                                }).data('kendoValidator');
                                if (!validator.validateInput($(input)))
                                    return;
                                var cartQty = parseInt(input.val());
                                app.viewModels.prodDetViewModel.addLineToCart(cartQty);
                            }
                            if (button.name == 'locDetails') {
                                app.viewModels.prodDetViewModel.set("currentLoc", e.dataItem);
                                app.navigate('views/locDetView.html');
                            } else if (button.name == 'increment-qty') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                if (!enabledBackOrders || enabledBackOrders == 'false') {
                                    var max = parseFloat(input[0].dataset.afs);
                                    var currentValue = parseFloat($(input).val());
                                    if (currentValue >= max || currentValue + 1 > max) {
                                        VibrationController.vibrate();
                                        return;
                                    }
                                }
                                $(input).val(currentValue + 1);
                            } else if (button.name == 'decrement-qty') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                var currentValue = parseFloat($(input).val());
                                if (currentValue <= 0 || currentValue - 1 <= 0) {
                                    VibrationController.vibrate();
                                    return;
                                }
                                $(input).val(currentValue - 1);
                            }
                        } catch (e) {
                            alert('Error: ', e);
                        }
                    }
                });
            }
            catch (ex) {
                alert("Error in initproductDetView: " + ex);
            }
        },
        addLineToCart: function (qty) {
            app.mobileApp.showLoading();
            lineAdded = function () {
                app.mobileApp.hideLoading();
                MessageDialogController.showMessage('Product Added to the Cart', "Success");
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
        createNotesDataSource: function () {
            this.notesDataSource = {
                transport: {
                    read: function (options) {
                        //displaying notes if exist
                        if (app.viewModels.prodDetViewModel.product && app.viewModels.prodDetViewModel.product.eProductNote &&
                            app.viewModels.prodDetViewModel.product.eProductNote.length) {
                            options.success(app.viewModels.prodDetViewModel.product.eOrderNote);
                            $('.prod-notes-collapsible').show();
                        }
                        else {
                            options.success([]);
                            $('.prod-notes-collapsible').hide();
                        }
                    }
                },
                error: function (e) {
                    alert('Error: ', e);
                }
            };
        },
        createProdImageDataSource: function () {
            this.prodImageDataSource = {
                transport: {
                    read: function (options) {
                        var prodImageList = app.viewModels.prodDetViewModel.prodImageList || [];
                        if (prodImageList.length) {
                            $('.images-info').show();
                            $('.images-placeholder').hide();
                        } else {
                            $('.images-info').hide();
                            $('.images-placeholder').show();
                        }
                        options.success(prodImageList);
                    }
                },
                error: function (e) {
                    alert('Error: ', e);
                }
            };
        },
        createProdLocDataSource: function () {
            var eLoc = locationModel();
            this.prodLocDataSource = {
                schema: {
                    model: eLoc,
                },
                transport: {
                    read: function (options) {
                        var prodLocList = app.viewModels.prodDetViewModel.prodLocList || [];
                        if (prodLocList.length) {
                            $('.locations-header').show();
                            $('.locations-info').show();
                            $('.locations-placeholder').hide();
                        } else {
                            $('.locations-header').show();
                            $('.locations-info').hide();
                            $('.locations-placeholder').show();
                        }
                        options.success(prodLocList);
                    }
                },
                error: function (e) {
                    alert('Error: ', e);
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
                                var product = null;
                                if (details.response.dsProd.dsProd.eProduct && details.response.dsProd.dsProd.eProduct.length) {
                                    product = details.response.dsProd.dsProd.eProduct[0];
                                    product.ShopCartIndicatorDisplay = product.CartQty > 0 ? 'visible' : 'none';
                                }
                                options.success([product]);
                                app.viewModels.prodDetViewModel.product = product;
                                $("#prodNotes").data("kendoMobileListView").dataSource.read();
                                //assigning image list data
                                app.viewModels.prodDetViewModel.set("prodImageList", details.response.dsProd.dsProd.eProductImg);
                                $("#prodDetailImageView").data("kendoMobileListView").dataSource.read();
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
                        alert('Error: ', e);
                    }
                };
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
    });

    parent.prodDetViewModel = prodDetViewModel;

})(app.viewModels);


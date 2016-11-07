(function (parent) {
    var shopcartDetViewModel = kendo.observable({
        jsdoDataSource: undefined,
        notesDataSource: undefined,
        linesDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        selectedNote: {},
        shopCart: undefined,
        origRow: {},
        resourceName: 'Shopping Cart',
        forceLoad: false,
        onBeforeShow: function () {
            var shopcartHeader = $("#shopcartHeader").data("kendoMobileListView");
            if (shopcartHeader === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.shopcartDetViewModel.onInit(this);
            } else if (shopcartHeader.dataSource && shopcartHeader.dataSource.data().length === 0 ||
                app.viewModels.shopcartDetViewModel.forceLoad) {
                shopcartHeader.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.shopcartDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.shopcartDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.shopcartDetViewModel.createJSDODataSource();
                app.viewModels.shopcartDetViewModel.createNotesDataSource();
                app.viewModels.shopcartDetViewModel.createLinesDataSource();
                app.views.listView = e.view;
                // Create list
                $("#shopcartHeader").kendoMobileListView({
                    dataSource: app.viewModels.shopcartDetViewModel.jsdoDataSource,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    autoBind: false,
                    template: kendo.template($("#shopcartHeaderTemplate").html()),
                });
                $("#shopcartNotes").kendoMobileListView({
                    dataSource: app.viewModels.shopcartDetViewModel.notesDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    autoBind: false,
                    template: kendo.template($("#shopcartNoteTemplate").html()),
                    click: function (e) {
                        app.viewModels.shopcartDetViewModel.set("selectedNote", e.dataItem);
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'update-note') {
                                app.mobileApp.navigate('views/shopcartNoteDetView.html');
                            }
                            else if (button.name == 'delete-note') {
                                var callback = function (index) {
                                    if (index == 1)
                                        app.viewModels.shopcartDetViewModel.deleteNote();
                                }
                                MessageDialogController.showConfirm("Are you sure you want to delete the note?", callback, "Yes,No", "Delete Note");
                            }
                        } catch (e) { }
                    }
                });
                $("#shopcartLines").kendoMobileListView({
                    dataSource: app.viewModels.shopcartDetViewModel.linesDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    autoBind: false,
                    template: kendo.template($("#shopcartLineTemplate").html()),
                    click: function (e) {
                        app.viewModels.shopcartDetViewModel.set("selectedRow", e.dataItem);
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'update-line') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                //analizing "enabledBackOrders" parameter
                                var enabledBackOrders = localStorage.getItem('enabledBackOrder') || false;
                                if (!enabledBackOrders || enabledBackOrders == 'false') {
                                    var afs = parseFloat(button.dataset.afs);
                                    $(input).attr('max', afs); //adding max attribute which AFS
                                }
                                var validator = $(form).kendoValidator({
                                    validateOnBlur: false
                                }).data('kendoValidator');
                                if (!validator.validateInput($(input)))
                                    return;
                                var orderQty = parseInt(input.val());
                                app.viewModels.shopcartDetViewModel.updateLine(orderQty);
                            }
                            else if (button.name == 'delete-line') {
                                var callback = function (index) {
                                    if (index == 1)
                                        app.viewModels.shopcartDetViewModel.updateLine(0);
                                }
                                MessageDialogController.showConfirm("Are you sure you want to delete the line?", callback, "Yes,No", "Delete Line");
                            }
                        } catch (e) { }
                    }
                });
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        createNotesDataSource: function () {
            this.notesDataSource = {
                transport: {
                    read: function (options) {
                        if (app.viewModels.shopcartDetViewModel.shopCart && app.viewModels.shopcartDetViewModel.shopCart.eOrderNote &&
                            app.viewModels.shopcartDetViewModel.shopCart.eOrderNote.length)
                            options.success(app.viewModels.shopcartDetViewModel.shopCart.eOrderNote);
                        else
                            options.success([]);
                    }
                },
                error: function (e) {
                    alert('Error: ', e);
                }
            };
        },
        createLinesDataSource: function () {
            this.linesDataSource = {
                transport: {
                    read: function (options) {
                        if (app.viewModels.shopcartDetViewModel.shopCart && app.viewModels.shopcartDetViewModel.shopCart.eOrderLine &&
                            app.viewModels.shopcartDetViewModel.shopCart.eOrderLine.length)
                            options.success(app.viewModels.shopcartDetViewModel.shopCart.eOrderLine);
                        else
                            options.success([]);
                    }
                },
                error: function (e) {
                    alert('Error: ', e);
                }
            };
        },
        createJSDODataSource: function () {
            try {
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsOrder';
                jsdoSettings.tableName = 'eOrder';
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false
                });
                this.jsdoDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            var promise = app.viewModels.shopcartDetViewModel.jsdoModel.invoke('CartRead', {});
                            promise.done(function (session, result, details) {
                                var shopCart = null;
                                if (details.response.dsOrder.dsOrder.eOrder && details.response.dsOrder.dsOrder.eOrder.length) {
                                    shopCart = details.response.dsOrder.dsOrder.eOrder[0];
                                }
                                if (shopCart) {                                    
                                    //displaying lines or place holder
                                    if (shopCart.eOrderLine && shopCart.eOrderLine.length) {
                                        $('#shopcartLines').show();
                                        $('.lines-placeholder').hide();
                                        $('.place-order').show();
                                        $('.shopcart-header-info').text('(' + shopCart.eOrderLine.length + ')');
                                    } else {
                                        $('#shopcartLines').hide();
                                        $('.lines-placeholder').show();
                                        $('.place-order').hide();
                                        $('.shopcart-header-info').text('');
                                    }
                                    //displaying notes or placeholder
                                    if (shopCart.eOrderNote && shopCart.eOrderNote.length) {
                                        $('.notes-collapsible').show();
                                    } else {
                                        $('.notes-collapsible').hide();
                                    }
                                    $('.shopcart-info').show();
                                    $('.shopcart-placeholder').hide();
                                    //adding Currency to each line for making easier to show it
                                    if (shopCart.eOrderLine) {
                                        shopCart.eOrderLine.forEach(function (line) {
                                            line.CurrencyId = shopCart.CurrencyId;
                                        });
                                    }
                                    options.success([shopCart]);
                                } else {
                                    $('.shopcart-header-info').text('');
                                    $('.shopcart-info').hide();
                                    $('.shopcart-placeholder').show();
                                    options.success([]);
                                }
                                app.viewModels.shopcartDetViewModel.shopCart = shopCart;
                                $("#shopcartNotes").data("kendoMobileListView").dataSource.read();
                                $("#shopcartLines").data("kendoMobileListView").dataSource.read();
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
        updateLine: function (orderQty) {
            app.mobileApp.showLoading();
            successUpd = function () {
                app.mobileApp.hideLoading();
                app.viewModels.shopcartDetViewModel.forceLoad = true;
                app.viewModels.shopcartDetViewModel.onBeforeShow();
                VibrationController.vibrate();
            }
            eOrderobj = new EOrderClass();
            eOrderobj.setCustId(localStorage.getItem('defaultCustomer'));
            var eoline = {
                "LocId": app.viewModels.shopcartDetViewModel.selectedRow.LocId,
                "ProdRecno": app.viewModels.shopcartDetViewModel.selectedRow.ProdRecno,
                "OrderQty": orderQty,
                "LineNo": app.viewModels.shopcartDetViewModel.selectedRow.LineNo,
                "Checksum": app.viewModels.shopcartDetViewModel.selectedRow.Checksum,
                "Rowid": app.viewModels.shopcartDetViewModel.selectedRow.Rowid
            }
            eOrderobj.addLine(eoline);
            addLineToShoppingCart(eOrderobj.getEOrder(), successUpd);
        },
        placeOrder: function () {
            app.mobileApp.showLoading();
            var promise = app.viewModels.shopcartDetViewModel.jsdoModel.invoke('FinOrder', {});
            promise.done(function (session, result, details) {
                var errors = false;
                try {
                    if (details.success)
                        errors = app.getErrors(details.response.dsOrder.dsOrder.restResult);
                    else {
                        errors = true;
                        MessageDialogController.showMessage('Placing the order failed', "Error");
                    }
                } catch (e) {
                    errors = true;
                    MessageDialogController.showMessage('Placing the order failed', "Error");
                }
                if (errors) {
                    app.mobileApp.hideLoading();
                    return;
                }
                var transNo = details.response.dsOrder.dsOrder.eOrder[0].TransNo;
                MessageDialogController.showMessage('Orcer ' + transNo + ' has been created', "Success");
                app.viewModels.shopcartDetViewModel.forceLoad = true;
                app.viewModels.shopcartDetViewModel.onBeforeShow();
                app.mobileApp.hideLoading();
            });
            promise.fail(function () {
                app.mobileApp.hideLoading();
                MessageDialogController.showMessage('Placing the order failed', "Error");
            });
        },
        addNotes: function () {
            app.viewModels.shopcartDetViewModel.set("selectedNote", {});
            app.mobileApp.navigate('views/shopcartNoteDetView.html');
        },
        deleteNote: function () {
            alert('delete');
        }
    });
    parent.shopcartDetViewModel = shopcartDetViewModel;

})(app.viewModels);

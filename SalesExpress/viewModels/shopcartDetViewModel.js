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
        beforeNavigate: function (callbackFn) {
            //checking for unsaved lines (we are using disabled attribute in save button)
            var allLines = $('#shopcartDet .update-line');
            var savedLines = $('#shopcartDet .update-line[disabled]');
            if (allLines.length > savedLines.length) {
                var callback = function (index) {
                    if (index == 1) {
                        callbackFn();
                    }
                }
                MessageDialogController.showConfirm("You are going to lose unsaved changes. Are you sure you want to proceed?", callback, "Yes,No", "Unsaved changes");
            } else
                callbackFn();
        },
        onShow: function () {
            var shopcartHeader = $("#shopcartHeader").data("kendoMobileListView");
            if (shopcartHeader === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.shopcartDetViewModel.onInit(this);
            } else {
                shopcartHeader.dataSource.read();
                $("#shopcart-notes-collapsible").data("kendoMobileCollapsible").collapse();
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
                    click: function (e) {
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'update-shopcart') {
                                app.navigate('views/shopcartHeaderEditView.html');
                            }
                        } catch (e) { }
                    }
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
                                app.navigate('views/shopcartNoteDetView.html');
                            }
                            else if (button.name == 'delete-note') {
                                var callback = function (index) {
                                    if (index == 1)
                                        app.viewModels.shopcartDetViewModel.deleteNote(e.dataItem);
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
                                if (!app.viewModels.shopcartDetViewModel.validateLineQty(input[0]))
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
                            } else if (button.name == 'increment-qty') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                //taking current afs and value
                                var afs = parseFloat($(e.item).find('.line-afs').text());
                                var currentValue = parseFloat($(input).val());
                                var enabledBackOrders = localStorage.getItem('enabledBackOrder') || false;
                                if (!enabledBackOrders || enabledBackOrders == 'false') {
                                    if (afs <= 0 || (afs - 1) < 0) {
                                        VibrationController.vibrate();
                                        return;
                                    }
                                }
                                $(input).val(currentValue + 1); //incrementing value
                                $(input).trigger('keyup');
                            } else if (button.name == 'decrement-qty') {
                                var form = e.item.find('form');
                                var input = e.item.find('input');
                                //taking current afs and value
                                var afs = parseFloat($(e.item).find('.line-afs').text());
                                var currentValue = parseFloat($(input).val());
                                if (currentValue <= 0 || currentValue - 1 <= 0) {
                                    VibrationController.vibrate();
                                    return;
                                }
                                $(input).val(currentValue - 1); //decrementing value
                                $(input).trigger('keyup');
                            }
                        } catch (e) { }
                    }
                });
            }
            catch (ex) {
                alert("Error in initListView: " + ex);
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
                        $("#shopcartLines .input-qty").off('change', app.viewModels.shopcartDetViewModel.qtyChange);
                        if (app.viewModels.shopcartDetViewModel.shopCart && app.viewModels.shopcartDetViewModel.shopCart.eOrderLine &&
                            app.viewModels.shopcartDetViewModel.shopCart.eOrderLine.length)
                            options.success(app.viewModels.shopcartDetViewModel.shopCart.eOrderLine);
                        else
                            options.success([]);
                        $("#shopcartLines .input-qty").on('keyup paste', function (e) {
                            var currentValue = parseFloat($(e.target).val());
                            if (isNaN(currentValue))
                                currentValue = 0;
                            e.target.dataset.lastValue = currentValue; //setting last value
                            var originalValue = parseFloat(e.target.dataset.originalValue);
                            //extra protection
                            if (isNaN(originalValue))
                                originalValue = 0;
                            var originalAfs = parseFloat(e.target.dataset.originalAfs);
                            //extra protection
                            if (isNaN(originalAfs))
                                originalAfs = 0;
                            var form = $(e.target).closest('form');

                            if (currentValue != originalValue)
                                $(form).find('.update-line').prop('disabled', false);
                            else
                                $(form).find('.update-line').prop('disabled', true);
                            var afs = originalAfs + originalValue;
                            var remainingAfs = afs - currentValue;
                            if (remainingAfs < 0)
                                remainingAfs = 0;
                            $(form).find('.line-afs').text(remainingAfs);
                            app.viewModels.shopcartDetViewModel.validateLineQty(e.target);
                        });
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
                app.jsdoSettings.resourceName = 'dsOrder';
                app.jsdoSettings.tableName = 'eOrder';
                // create JSDO
                this.jsdoModel = new progress.data.JSDO({
                    name: app.jsdoSettings.resourceName,
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
                                    //formatting values before showing them
                                    shopCart.AbsoluteDiscount = shopCart.Discount * -1;
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
                                    //displaying notes if exist
                                    if (shopCart.eOrderNote && shopCart.eOrderNote.length) {
                                        $('.shopcart-notes-collapsible').show();
                                    } else {
                                        $('.shopcart-notes-collapsible').hide();
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
                app.viewModels.shopcartDetViewModel.onShow();
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
            var callbackFn = function () {
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
                    app.viewModels.shopcartDetViewModel.onShow();
                    app.mobileApp.hideLoading();
                });
                promise.fail(function () {
                    app.mobileApp.hideLoading();
                    MessageDialogController.showMessage('Placing the order failed', "Error");
                });
            }
            app.viewModels.shopcartDetViewModel.beforeNavigate(callbackFn);
        },
        addNotes: function () {
            app.viewModels.shopcartDetViewModel.set("selectedNote", {});
            app.navigate('views/shopcartNoteDetView.html');
        },
        deleteNote: function (note) {
            app.mobileApp.showLoading();
            app.jsdoSettings.resourceName = 'dsOrder';
            var deleteNotesJSDOModel = new progress.data.JSDO({
                name: app.jsdoSettings.resourceName,
                autoFill: false,
            });
            var data = {
                "dsOrder": {
                    "eOrder": [
                      {
                          "ControlEnt": app.viewModels.shopcartDetViewModel.shopCart.ControlEnt,
                          "TransNo": app.viewModels.shopcartDetViewModel.selectedNote.TransNo,
                          "TransCode": app.viewModels.shopcartDetViewModel.selectedNote.TransCode,
                          "eOrderNote": [
                            {
                                "TransNo": app.viewModels.shopcartDetViewModel.selectedNote.TransNo,
                                "TransCode": app.viewModels.shopcartDetViewModel.selectedNote.TransCode,
                                "NoteId": app.viewModels.shopcartDetViewModel.selectedNote.NoteId,
                                "Rowid": app.viewModels.shopcartDetViewModel.selectedNote.Rowid,
                                "CheckSum": app.viewModels.shopcartDetViewModel.selectedNote.Checksum,
                            }
                          ]
                      }
                    ]
                }
            };
            var promise = deleteNotesJSDOModel.invoke('DeleteNotes', data);
            promise.done(function (session, result, details) {
                if (details.success == true) {
                    var errors = false;
                    try {
                        errors = app.getErrors(details.response.dsOrder.dsOrder.restResult);
                    } catch (e) {
                        alert("Error", e)
                    }
                    if (errors) {
                        app.mobileApp.hideLoading();
                        return;
                    }
                    app.viewModels.shopcartDetViewModel.onShow();
                }
            });
            promise.fail(function () {
                app.mobileApp.hideLoading();
                MessageDialogController.showMessage('Deleting the note failed', "Error");
            });
        },
        validateLineQty: function (input) {
            //analizing "enabledBackOrders" parameter
            var form = $(input).closest('form')[0];
            var enabledBackOrders = localStorage.getItem('enabledBackOrder') || false;
            if (!enabledBackOrders || enabledBackOrders == 'false') {
                var afs = parseFloat(input.dataset.originalAfs) + parseFloat(input.dataset.originalValue);
                $(input).attr('max', afs); //adding max attribute for native validation
            }
            var validator = $(form).kendoValidator({
                validateOnBlur: false,
                messages: {
                    min: function (input) {
                        return input[0].name + ' should be greater than 0';
                    }
                }
            }).data('kendoValidator');
            var valid = validator.validateInput($(input));
            $(input).removeAttr('max'); //removing max attribute
            return valid;
        }
    });
    parent.shopcartDetViewModel = shopcartDetViewModel;

})(app.viewModels);

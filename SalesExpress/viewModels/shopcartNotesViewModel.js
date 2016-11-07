(function (parent) {
    var shopcartNotesViewModel = kendo.observable({
        noteText: null,
        noteIdList: [],
        origRow: {},
        resourceName: 'Shopping Cart Notes',
        forceLoad: false,
        backButton: true,
        onBeforeShow: function () {
            kendo.bind($('#shopcartNotesHeader'), app.viewModels.shopcartNotesViewModel.shopCart, kendo.mobile.ui);
            // Set list title to resource name
            if (app.viewModels.shopcartNotesViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.shopcartNotesViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                var me = app.viewModels.shopcartNotesViewModel;
                me.set("noteIdList", ["EA", "BOX", "New"]);
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        saveNotes: function (e) {
            var notes = noteText.value;
            jsdoSettings.resourceName = 'dsOrder';
            var updateNotesJSDOModel = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false,
            });
            var updateNotesData = {
                "dsOrder": {
                    "eOrder": {}
                }
            };
            var promise = updateNotesJSDOModel.invoke('AddOrderLine', updateLineData);
            promise.done(function (session, result, details) {
                if (details.success == true) {
                    var errors = false;
                    try {
                        errors = app.getErrors(details.response.dsOrder.dsOrder.restResult);
                    } catch (e) {
                        console.log("Error", e)
                    }
                    if (errors) {
                        app.mobileApp.hideLoading();
                        return;
                    }
                    // Executing call back as everything finshed successfully            
                    app.back();
                }
            });
            promise.fail(function () {
                app.mobileApp.hideLoading();
                MessageDialogController.showMessage('Saving notes failed', "Error");
            });
        },
        cancel: function (e) {
            app.back();
        },
    });
    parent.shopcartNotesViewModel = shopcartNotesViewModel;

})(app.viewModels);

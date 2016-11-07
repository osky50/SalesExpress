(function (parent) {
    var shopcartNoteDetViewModel = kendo.observable({
        rowId: undefined,
        checksum: undefined,
        noteText: undefined,
        noteId: undefined,
        noteIdList: [],
        origRow: {},
        resourceName: 'Shopping Cart Notes',
        forceLoad: false,
        backButton: true,
        onBeforeShow: function () {
            kendo.bind($('#shopcartNotesHeader'), app.viewModels.shopcartDetViewModel.shopCart, kendo.mobile.ui);
            app.viewModels.shopcartNoteDetViewModel.rowId = app.viewModels.shopcartDetViewModel.selectedNote.Rowid || '';
            app.viewModels.shopcartNoteDetViewModel.checksum = app.viewModels.shopcartDetViewModel.selectedNote.Checksum || '';
            app.viewModels.shopcartNoteDetViewModel.noteText = app.viewModels.shopcartDetViewModel.selectedNote.NoteText;
            app.viewModels.shopcartNoteDetViewModel.noteId = app.viewModels.shopcartDetViewModel.selectedNote.NoteId;
            kendo.bind($('#noteDetails'), app.viewModels.shopcartNoteDetViewModel, kendo.mobile.ui);
            // Set list title to resource name
            if (app.viewModels.shopcartNoteDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.shopcartNoteDetViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                var me = app.viewModels.shopcartNoteDetViewModel;
                me.set("noteIdList", ["in", "so", "ar"]);
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        saveNotes: function (e) {
            debugger;
            jsdoSettings.resourceName = 'dsOrder';
            var updateNotesJSDOModel = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false,
            });
            var data = {
                "dsOrder": {
                    "eOrder": [
                      {
                          "ControlEnt": app.viewModels.shopcartDetViewModel.shopCart.ControlEnt,
                          "TransNo": app.viewModels.shopcartDetViewModel.shopCart.TransNo,
                          "TransCode": app.viewModels.shopcartDetViewModel.shopCart.TransCode,
                          "eOrderNote": [
                            {
                                "TransNo": app.viewModels.shopcartDetViewModel.shopCart.TransNo,
                                "TransCode": app.viewModels.shopcartDetViewModel.shopCart.TransCode,
                                "NoteId": app.viewModels.shopcartNoteDetViewModel.noteId,
                                "Rowid": app.viewModels.shopcartNoteDetViewModel.rowId,
                                "CheckSum": app.viewModels.shopcartNoteDetViewModel.checksum,
                                "NoteText": app.viewModels.shopcartNoteDetViewModel.noteText
                            }
                          ]
                      }
                    ]
                }
            };
            var promise = updateNotesJSDOModel.invoke('SaveNotes', data);
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
                    app.viewModels.shopcartDetViewModel.forceLoad = true; //for loading again the shopping cart
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
    parent.shopcartNoteDetViewModel = shopcartNoteDetViewModel;

})(app.viewModels);

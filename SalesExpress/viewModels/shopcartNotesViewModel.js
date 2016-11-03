(function (parent) {
    var shopcartNotesViewModel = kendo.observable({
        jsdoDataSource: undefined,
        jsdoModel: undefined,
        selectedRow: {},
        noteText: null,
        noteIdList: [],
        origRow: {},
        resourceName: 'Shopping Cart Notes',
        forceLoad: false,
        backButton: true,
        onBeforeShow: function () {
            kendo.bind($('#shopcartNotesHeader'), app.viewModels.shopcartDetViewModel.shopCart, kendo.mobile.ui);
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
            alert(noteText);
        },
        
    });
    parent.shopcartNotesViewModel = shopcartNotesViewModel;

})(app.viewModels);

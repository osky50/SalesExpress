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

        // The order of the firing of events is as follows:
        //   before-show
        //   init (fires only once)
        //   show

        onBeforeShow: function () {
            debugger;
            var shopcart = app.viewModels.shopcartDetViewModel.shopCart;
            kendo.bind($('#shopcartNoteHeader'), shopcart, kendo.mobile.ui);
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
            debugger;
            alert(noteText);
        },
        
    });
    parent.shopcartNotesViewModel = shopcartNotesViewModel;

})(app.viewModels);

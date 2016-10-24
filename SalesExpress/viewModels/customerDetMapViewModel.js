(function (parent) {
    var customerDetMapViewModel = kendo.observable({
        resourceName: 'Customer Directions',
        onBeforeShow: function () {
            var map = $("#map").data("kendoMap");
            if (map === undefined || app.viewModels.customerDetMapViewModel.forceLoad) { //extra protection in case onInit have not been fired yet
                app.viewModels.customerDetMapViewModel.onInit(this);
            }
            // Set list title to resource name
            if (app.viewModels.customerDetMapViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.customerDetMapViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                app.views.listView = e.view;
                // Create list
                $("#map").kendoMap({
                    center: [30.268107, -97.744821],
                    zoom: 3,
                    layers: [{
                        type: "tile",
                        urlTemplate: "http://#= subdomain #.tile.openstreetmap.org/#= zoom #/#= x #/#= y #.png",
                        subdomains: ["a", "b", "c"],
                        attribution: "&copy; <a href='http://osm.org/copyright'>OpenStreetMap contributors</a>"
                    }],
                    markers: [{
                        location: [30.268107, -97.744821],
                        shape: "pinTarget",
                        tooltip: {
                            content: "Austin, TX"
                        }
                    }]
                });
            }
            catch (ex) {
                app.showError(ex.message);
            }
        },
    });
    parent.customerDetMapViewModel = customerDetMapViewModel;

})(app.viewModels);

(function (parent) {
    var customerDetMapViewModel = kendo.observable({
        resourceName: 'Customer Directions',
        onBeforeShow: function () {
            if (app.viewModels.customerDetMapViewModel.map === undefined) {
                app.viewModels.customerDetMapViewModel.onInit(this);
            } else
                app.viewModels.customerDetMapViewModel.getDirections();
            // Set list title to resource name
            if (app.viewModels.customerDetMapViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.customerDetMapViewModel.resourceName);
            }
        },
        onInit: function (e) {
            var startLocation = '4918, Roper Road NW, Edmonton, AB, T6B3T7';  // Default to Hollywood, CA when no geolocation support
            app.viewModels.customerDetMapViewModel.DirectionsService = new google.maps.DirectionsService();
            app.viewModels.customerDetMapViewModel.DirectionsDisplay = new google.maps.DirectionsRenderer();
            var mapOptions = {
                zoom: 10,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            app.viewModels.customerDetMapViewModel.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            app.viewModels.customerDetMapViewModel.DirectionsDisplay.setMap(app.viewModels.customerDetMapViewModel.map);
        },
        getDirections: function () {
            var drawMap = function (origin) {
                var request = {
                    origin: origin,
                    destination: app.viewModels.customerDetViewModel.selectedRow.FormattedAddress,
                    travelMode: 'DRIVING'
                };
                app.viewModels.customerDetMapViewModel.DirectionsService.route(request, function (result, status) {
                    if (status == 'OK') {
                        app.viewModels.customerDetMapViewModel.DirectionsDisplay.setDirections(result);
                    }
                });
            }
            if (navigator.geolocation) {
                function success(pos) {
                    // Location found, show map with these coordinates
                    drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                }
                function fail(error) {
                    drawMap(startLocation);  // Failed to find location, show default map
                }
                // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
                navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 500000, enableHighAccuracy: true, timeout: 6000 });
            } else {
                drawMap(startLocation);  // No geolocation support, show default map
            }
        }
    });
    parent.customerDetMapViewModel = customerDetMapViewModel;

})(app.viewModels);

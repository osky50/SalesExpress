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
            debugger;
            var drawMap = function (latlng) {
                var myOptions = {
                    zoom: 10,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                app.DirectionsService = new google.maps.DirectionsService();
                app.DirectionsDisplay = new google.maps.DirectionsRenderer();
                var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
                // Add an overlay to the map of current lat/lng
                var marker = new google.maps.Marker({
                    position: latlng,
                    map: map,
                    title: "Greetings!"
                });
            }
            var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434);  // Default to Hollywood, CA when no geolocation support
            if (navigator.geolocation) {
                function success(pos) {
                    // Location found, show map with these coordinates
                    drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                }
                function fail(error) {
                    drawMap(defaultLatLng);  // Failed to find location, show default map
                }
                // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
                navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 500000, enableHighAccuracy: true, timeout: 6000 });
            } else {
                drawMap(defaultLatLng);  // No geolocation support, show default map
            }
            
        },
    });
    parent.customerDetMapViewModel = customerDetMapViewModel;

})(app.viewModels);

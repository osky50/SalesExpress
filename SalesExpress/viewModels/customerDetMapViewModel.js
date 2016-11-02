(function (parent) {
    var customerDetMapViewModel = kendo.observable({
        resourceName: 'Customer Directions',
        backButton: true,
        onBeforeShow: function () {
            $(document).on("pagecontainershow", app.viewModels.customerDetMapViewModel.scaleContentToDevice);
            $(window).on("resize orientationchange", app.viewModels.customerDetMapViewModel.scaleContentToDevice);
            app.viewModels.customerDetMapViewModel.getDirections();
            // Set list title to resource name
            if (app.viewModels.customerDetMapViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.customerDetMapViewModel.resourceName);
            }
        },
        onHide: function () {
            $(document).off("pagecontainershow", app.viewModels.customerDetMapViewModel.scaleContentToDevice);
            $(window).off("resize orientationchange", app.viewModels.customerDetMapViewModel.scaleContentToDevice);
        },
        onInit: function (e) {

        },
        scaleContentToDevice: function () {
            scroll(0, 0);
            var contentHeight = $(window).height() - $("#customerDetMap .km-header").outerHeight();
            var contentWidth = $(window).width();
            $("#map-canvas").height(contentHeight);
            $("#map-canvas").width(contentWidth);
        },
        getDirections: function () {
            app.viewModels.customerDetMapViewModel.scaleContentToDevice();
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
            };
            window.onMapsApiLoaded = function () {
                try {
                    //alert('map loaded');
                    var startLocation = '4918, Roper Road NW, Edmonton, AB, T6B3T7';  // Default to Hollywood, CA when no geolocation support
                    app.viewModels.customerDetMapViewModel.DirectionsService = new google.maps.DirectionsService();
                    //alert('dierction service:' + app.viewModels.customerDetMapViewModel.DirectionsService);
                    app.viewModels.customerDetMapViewModel.DirectionsDisplay = new google.maps.DirectionsRenderer();
                    //alert('dierction display:' + app.viewModels.customerDetMapViewModel.DirectionsDisplay);
                    var mapOptions = {
                        zoom: 10,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    };
                    //alert('map options:' + mapOptions);
                    app.viewModels.customerDetMapViewModel.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
                    //alert('map:' + app.viewModels.customerDetMapViewModel.map);
                    app.viewModels.customerDetMapViewModel.DirectionsDisplay.setMap(app.viewModels.customerDetMapViewModel.map);
                    if (navigator.geolocation) {
                        function success(pos) {
                            //alert('current position success');
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
                } catch (e) {
                    alert(e.message);
                }
            }
            $.getScript('http://maps.googleapis.com/maps/api/js?key=AIzaSyAvDWQocuKu7fM1Mb73X9Q-YbDARxMSEMY&sensor=true&callback=onMapsApiLoaded');
        }
    });
    parent.customerDetMapViewModel = customerDetMapViewModel;

})(app.viewModels);

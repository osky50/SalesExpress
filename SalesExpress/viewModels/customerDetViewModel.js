(function (parent) {
    var customerDetViewModel = kendo.observable({
        customerDetDataSource: undefined,
        customerDetJsdoModel: undefined,
        customerPerfDataSource: undefined,
        customerPerfJsdoModel: undefined,
        perfData: undefined,
        origRow: {},
        resourceName: 'Customer Details',
        onBeforeShow: function () {
            $(window).on("orientationchange", app.viewModels.customerDetViewModel.devOrientHandler);
            var customerDetData = $("#customerDetData").data("kendoMobileListView");
            if (customerDetData === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.customerDetViewModel.onInit(this);
            } else {
                customerDetData.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.customerDetViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.customerDetViewModel.resourceName);
            }
        },
        devOrientHandler: function () {
            setTimeout(function () {
                app.viewModels.customerDetViewModel.createPerfGraph();
            }, 100)
        },
        onHide: function () {
            $(window).off("orientationchange", app.viewModels.customerDetViewModel.devOrientHandler);
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.customerDetViewModel.createCustomerDetDataSource();
                app.viewModels.customerDetViewModel.createCustomerPerfDataSource();
                app.views.listView = e.view;
                // Create list
                $("#customerDetData").kendoMobileListView({
                    dataSource: app.viewModels.customerDetViewModel.customerDetDataSource,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    autoBind: false,
                    template: kendo.template($("#customerDetTemplate").html()),
                    click: function (e) {
                        app.viewModels.customerDetViewModel.set("selectedRow", e.dataItem);
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if (button.name == 'change-customer')
                                app.viewModels.customerDetViewModel.changeCustomer();
                            else if (button.name == 'directions')
                                app.viewModels.customerDetViewModel.getDirections();
                        } catch (e) { }
                    }
                });
                $("#customerPerfData").kendoMobileListView({
                    dataSource: app.viewModels.customerDetViewModel.customerPerfDataSource,
                    pullToRefresh: false,
                    style: "display: inline",
                    appendOnRefresh: false,
                    endlessScroll: false,
                    autoBind: false,
                    template: kendo.template($("#customerPerfTemplate").html()),
                    dataBound: function () {
                        app.viewModels.customerDetViewModel.createPerfGraph();
                    }
                });
            }
            catch (ex) {
                alert("Error in initListView: " + ex);
            }
        },
        createCustomerDetDataSource: function () {
            try {
                //configuring JSDO Settings
                app.jsdoSettings.resourceName = 'dsCust';
                app.jsdoSettings.tableName = 'eCustomer';
                var eCustomer = customerModel();
                // create JSDO
                this.customerDetJsdoModel = new progress.data.JSDO({
                    name: app.jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.customerDetDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            var me = this;
                            var promise = app.viewModels.customerDetViewModel.customerDetJsdoModel.invoke(
                                'GetCustomer',
                                {
                                    "CustomerId": localStorage.getItem('defaultCustomer'),
                                });
                            promise.done(function (session, result, details) {
                                //formatting the customer address
                                if (details.response.dsCust.dsCust.eCustomer) {
                                    details.response.dsCust.dsCust.eCustomer.forEach(function (eCustomer) {
                                        eCustomer.FormattedAddress = getFormattedAddress(eCustomer);
                                    });
                                    options.success(details.response.dsCust.dsCust.eCustomer);
                                } else {
                                    options.success([]);
                                }
                                var customerPerfData = $("#customerPerfData").data("kendoMobileListView");
                                customerPerfData.dataSource.read();
                                
                            });
                            promise.fail(function () {
                                options.success([]);
                            });
                        }
                    },
                    schema: {
                        model: eCustomer,
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
        createCustomerPerfDataSource: function () {
            try {
                //configuring JSDO Settings
                app.jsdoSettings.resourceName = 'dsCust';
                // create JSDO
                this.customerPerfJsdoModel = new progress.data.JSDO({
                    name: app.jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.customerPerfDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            var me = this;
                            var promise = app.viewModels.customerDetViewModel.customerPerfJsdoModel.invoke(
                                'CustPerfData', { "CustomerId": localStorage.getItem('defaultCustomer') });
                            promise.done(function (session, result, details) {
                                app.viewModels.customerDetViewModel.perfData = details.response.dsCustPerfData.dsCustPerfData;
                                options.success(details.response.dsCustPerfData.dsCustPerfData.eCustPerfData);
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
        changeCustomer: function () {
            app.navigate('views/customerListView.html');
        },
        getDirections: function () {
            app.navigate('views/customerDetMapView.html');
        },
        GetCustStatus: function (status) {
            var ostatus = status;
            switch (status.toUpperCase()) {
                case "A":
                    ostatus = "Active";
                    break;
                case "I":
                    ostatus = "Inactive";
                    break;
            }
            return ostatus;
        },
        createPerfGraph: function () {
            //creating the graph
            try {
                var eSeries = app.viewModels.customerDetViewModel.perfData.eSeries;
                var eTicks = app.viewModels.customerDetViewModel.perfData.eTicks[0].TValues;
                var series = [];
                var seriesValues = [];
                var seriesTicks = [];
                for (var i = 0; i < eSeries.length; i++) {
                    var serie = {
                        label: eSeries[i].Name,
                        barMargin: 1,
                        highlightMouseOver: true
                    }
                    series.push(serie);
                    seriesValues.push(eSeries[i].SValues);
                }
                $('#perf_graph').html('');

                $.jqplot('perf_graph', seriesValues, {
                    animate: false,
                    animateReplot: false,
                    // The "seriesDefaults" option is an options object that will
                    // be applied to all series in the chart.
                    seriesDefaults: {
                        renderer: $.jqplot.BarRenderer,
                        rendererOptions: { fillToZero: true },
                        pointLabels: {
                            show: true
                        }
                    },
                    // Custom labels for the series are specified with the "label"
                    // option on the series option.  Here a series option object
                    // is specified for each series.
                    series: series,
                    // Show the legend and put it outside the grid, but inside the
                    // plot container, shrinking the grid to accomodate the legend.
                    // A value of "outside" would not shrink the grid and allow
                    // the legend to overflow the container.
                    legend: {
                        show: true,
                        placement: 'outsideGrid',
                        location: 's'
                    },
                    axes: {
                        // Use a category axis on the x axis and use our custom ticks.
                        xaxis: {
                            renderer: $.jqplot.CategoryAxisRenderer,
                            ticks: eTicks
                        },
                        // Pad the y axis just a little so bars can get close to, but
                        // not touch, the grid boundaries.  1.2 is the default padding.
                        yaxis: {
                            pad: 1.5,
                            tickOptions: { formatString: '$%d' }
                        }
                    }
                });
            } catch (e) {

            }
        }
    });
    parent.customerDetViewModel = customerDetViewModel;

})(app.viewModels);

(function (parent) {
    var prodDetReviewsViewModel = kendo.observable({
        prodDetDataSource: undefined,
        prodDetReviewsDataSource: undefined,
        jsdoReviewsModel: undefined,
        selectedRow: {},
        origRow: {},
        resourceName: 'Product Reviews',
        onBeforeShow: function () {
            var prodDetView = $("#prodDetView").data("kendoMobileListView");
            if (prodDetView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.prodDetReviewsViewModel.onInit(this);
            } else {
                prodDetView.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.prodDetReviewsViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.prodDetReviewsViewModel.resourceName);
            }
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.prodDetReviewsViewModel.createProdDetDataSource();
                app.viewModels.prodDetReviewsViewModel.createProdDetReviewsDataSource();
                $("#prodDetView").kendoMobileListView({
                    dataSource: app.viewModels.prodDetReviewsViewModel.prodDetDataSource,
                    pullToRefresh: true,
                    style: "display: inline",
                    appendOnRefresh: false,
                    autoBind: false,
                    endlessScroll: false,
                    template: kendo.template($("#prodDetTemplate").html()),
                    dataBound: function (e) {
                        $('.rateit').each(function (index, element) {
                            var ratingValue = parseFloat(element.getAttribute('rating-value'));
                            var ratingStep = parseFloat(element.getAttribute('step'));
                            var elementObj = $(element);
                            elementObj.rateit();
                            elementObj.rateit('value', ratingValue);
                            elementObj.rateit('step', ratingStep);
                        });
                    }
                });
                $("#prodDetReviewsView").kendoMobileListView({
                    dataSource: app.viewModels.prodDetReviewsViewModel.prodDetReviewsDataSource,
                    style: "display: inline",
                    appendOnRefresh: false,
                    autoBind: false,
                    endlessScroll: false,
                    template: kendo.template($("#prodDetReviewTemplate").html()),
                    dataBound: function (e) {
                        $('.rateit').each(function (index, element) {
                            var ratingValue = parseFloat(element.getAttribute('rating-value'));
                            var ratingStep = parseFloat(element.getAttribute('step'));
                            var elementObj = $(element);
                            elementObj.rateit();
                            elementObj.rateit('value', ratingValue);
                            elementObj.rateit('step', ratingStep);
                        });
                    }
                });
            }
            catch (ex) {
                console.log("Error in init view: " + ex);
            }
        },
        createProdDetDataSource: function () {
            try {
                this.prodDetDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            options.success([app.viewModels.prodDetViewModel.selectedRow]);
                            setTimeout(app.viewModels.prodDetReviewsViewModel.graphReviewsSummary(), 500);
                            $("#prodDetReviewsView").data("kendoMobileListView").dataSource.read();
                        }
                    },
                    error: function (e) {
                        console.log('Error: ', e);
                    }
                };
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        createProdDetReviewsDataSource: function () {
            try {
                //configuring JSDO Settings
                jsdoSettings.resourceName = 'dsProd';
                jsdoSettings.tableName = 'ProdReview';
                this.jsdoReviewsModel = new progress.data.JSDO({
                    name: jsdoSettings.resourceName,
                    autoFill: false,
                });
                this.prodDetReviewsDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            var promise = app.viewModels.prodDetReviewsViewModel.jsdoReviewsModel.invoke('ReadProdReview', {
                                ProdRecno: app.viewModels.prodListViewModel.selectedRow.Prod_Recno,
                                Rating: "0"
                            });
                            promise.done(function (session, result, details) {
                                var errors = false;
                                try {
                                    errors = app.getErrors(details.response.dsProdReview.dsProdReview.wsReviewResult);
                                    if (errors)
                                        return;
                                    options.success(details.response.dsProdReview.dsProdReview.ProdReview[0].ProdReviewDet);
                                } catch (e) {
                                    options.success([]);
                                }
                            });
                            promise.fail(function () {
                                options.success([]);
                            });
                        }
                    },
                    error: function (e) {
                        console.log('Error: ', e);
                    }
                };
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        graphReviewsSummary: function (dsProdReview) {
            var oneStarsQty = 0;
            var twoStarsQty = 0;
            var threeStarsQty = 0;
            var fourStarsQty = 0;
            var fiveStarsQty = 0;
            try {
                /*this hook is used to make clckable y axis*/
                $.jqplot.postDrawHooks.push(function () {
                    createFiltersLinks('jqplot-yaxis-tick', ' star', '');
                    $.jqplot.postDrawHooks = [];
                });

                oneStarsQty = app.viewModels.prodDetViewModel.selectedRow.TotalReview1;
                twoStarsQty = app.viewModels.prodDetViewModel.selectedRow.TotalReview2
                threeStarsQty = app.viewModels.prodDetViewModel.selectedRow.TotalReview3
                fourStarsQty = app.viewModels.prodDetViewModel.selectedRow.TotalReview4
                fiveStarsQty = app.viewModels.prodDetViewModel.selectedRow.TotalReview5
                // For horizontal bar charts, x an y values must will be "flipped"
                // from their vertical bar counterpart.
                $("#graph").html('');
                var plot2 = $.jqplot('graph', [
                    [[oneStarsQty, '1 star'], [twoStarsQty, '2 star'], [threeStarsQty, '3 star'], [fourStarsQty, '4 star'], [fiveStarsQty, '5 star']]],
                    {
                        animate: true,
                        animateReplot: true,
                        seriesDefaults: {
                            renderer: $.jqplot.BarRenderer,
                            // Show point labels to the right ('e'ast) of each bar.
                            // edgeTolerance of -15 allows labels flow outside the grid
                            // up to 15 pixels.  If they flow out more than that, they
                            // will be hidden.
                            pointLabels: { show: true, location: 'e', edgeTolerance: -15 },
                            // Rotate the bar shadow as if bar is lit from top right.
                            shadowAngle: 135,
                            // Here's where we tell the chart it is oriented horizontally.
                            rendererOptions: {
                                barDirection: 'horizontal',
                                barWidth: 10
                            }
                        },
                        axes: {
                            yaxis: {
                                renderer: $.jqplot.CategoryAxisRenderer
                            }
                        }
                    });
                return true;
            } catch (e) {
                return false;
            };
        }
    });

    parent.prodDetReviewsViewModel = prodDetReviewsViewModel;

})(app.viewModels);


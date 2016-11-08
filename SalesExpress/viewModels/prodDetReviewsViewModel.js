(function (parent) {
    var prodDetReviewsViewModel = kendo.observable({
        prodDetDataSource: undefined,
        prodDetReviewsDataSource: undefined,
        jsdoReviewsModel: undefined,
        ratingFilter: "0",
        overridenRatingFilter: undefined,
        origRow: {},
        resourceName: 'Product Reviews',
        backButton: true,
        onBeforeShow: function () {
            $(window).on("orientationchange", app.viewModels.prodDetReviewsViewModel.devOrientHandler);
            var prodDetView = $("#prodDetView").data("kendoMobileListView");
            if (prodDetView === undefined) { //extra protection in case onInit have not been fired yet
                app.viewModels.prodDetReviewsViewModel.onInit(this);
            } else {
                if (app.viewModels.prodDetReviewsViewModel.overridenRatingFilter) {
                    app.viewModels.prodDetReviewsViewModel.ratingFilter = app.viewModels.prodDetReviewsViewModel.overridenRatingFilter;
                    app.viewModels.prodDetReviewsViewModel.overridenRatingFilter = undefined;
                } else
                    app.viewModels.prodDetReviewsViewModel.ratingFilter = '0'; //all reviews
                prodDetView.dataSource.read();
            }
            // Set list title to resource name
            if (app.viewModels.prodDetReviewsViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.prodDetReviewsViewModel.resourceName);
            }
        },
        devOrientHandler: function () {
            setTimeout(function () {
                app.viewModels.prodDetReviewsViewModel.createReviewsGraph();
            }, 100)
        },
        onHide: function () {
            $(window).off("orientationchange", app.viewModels.prodDetReviewsViewModel.devOrientHandler);
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
                    click: function (e) {
                        if (!e.button)
                            return;
                        try {
                            var button = e.button.element[0];
                            if ($(button).hasClass('link-active'))
                                return;
                            if (button.name == '0-stars-reviews-link' ||
                                button.name == '5-stars-reviews-link' ||
                                button.name == '4-stars-reviews-link' ||
                                button.name == '3-stars-reviews-link' ||
                                button.name == '2-stars-reviews-link' ||
                                button.name == '1-stars-reviews-link') {
                                app.viewModels.prodDetReviewsViewModel.ratingFilter =
                                    button.name.replace('-stars-reviews-link', '');
                                $("#prodDetReviewsView").data("kendoMobileListView").dataSource.read();
                                //changing style for curen filter
                                $('.rating-filter-container .link-active').addClass('link');
                                $('.rating-filter-container .link-active').removeClass('link-active');
                                $(button).addClass('link-active');
                            } else if (button.name == 'create-review-link') {
                                var addReviewCallback = function (prodReviewDet) {
                                    var prodDetView = $("#prodDetView").data("kendoMobileListView");
                                    app.viewModels.prodDetReviewsViewModel.overridenRatingFilter = prodReviewDet.rating.toString(); //all reviews
                                    app.back();
                                };
                                app.viewModels.prodAddReviewViewModel.set("selectedProduct", e.dataItem);
                                app.viewModels.prodAddReviewViewModel.successCallback = addReviewCallback;
                                app.mobileApp.navigate('views/prodAddReviewView.html');
                            }
                        } catch (e) { }
                    },
                    dataBound: function (e) {
                        scriptsUtils.createRatingsComponent('prod-det-reviews-rateit');
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
                        scriptsUtils.createRatingsComponent('prod-det-reviews-rateit');
                    }
                });
            }
            catch (ex) {
                alert("Error in init view: " + ex);
            }
        },
        createProdDetDataSource: function () {
            try {
                this.prodDetDataSource = {
                    transport: {
                        // when the grid tries to read data, it will call this function
                        read: function (options) {
                            options.success([app.viewModels.prodListViewModel.selectedRow]);
                            app.viewModels.prodDetReviewsViewModel.createReviewsGraph();
                            $("#prodDetReviewsView").data("kendoMobileListView").dataSource.read();
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
                                Rating: app.viewModels.prodDetReviewsViewModel.ratingFilter
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
                        alert('Error: ', e);
                    }
                };
            }
            catch (ex) {
                createDataSourceErrorFn({ errorObject: ex });
            }
        },
        createReviewsGraph: function () {
            try {
                /*this hook is used to make clckable y axis*/
                $.jqplot.postDrawHooks.push(function () {
                    createFiltersLinks('jqplot-yaxis-tick', ' star', '');
                    $.jqplot.postDrawHooks = [];
                });
                var oneStarsQty = app.viewModels.prodListViewModel.selectedRow.TotalReview1;
                var twoStarsQty = app.viewModels.prodListViewModel.selectedRow.TotalReview2
                var threeStarsQty = app.viewModels.prodListViewModel.selectedRow.TotalReview3
                var fourStarsQty = app.viewModels.prodListViewModel.selectedRow.TotalReview4
                var fiveStarsQty = app.viewModels.prodListViewModel.selectedRow.TotalReview5
                // For horizontal bar charts, x an y values must will be "flipped"
                // from their vertical bar counterpart.
                $("#reviews_graph").html('');
                $.jqplot('reviews_graph', [
                    [[oneStarsQty, '1 star'], [twoStarsQty, '2 star'], [threeStarsQty, '3 star'], [fourStarsQty, '4 star'], [fiveStarsQty, '5 star']]],
                    {
                        animate: false,
                        animateReplot: false,
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
                                barWidth: 10,
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
        },
    });

    parent.prodDetReviewsViewModel = prodDetReviewsViewModel;

})(app.viewModels);


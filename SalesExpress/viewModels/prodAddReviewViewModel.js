(function (parent) {
    var prodAddReviewViewModel = kendo.observable({
        jsdoReviewsModel: undefined,
        resourceName: 'Add Review',
        selectedProduct: undefined,
        successCallback: undefined,
        onBeforeShow: function (e) {
            //clear the form
            var view = e.view;
            // Set list title to resource name
            if (app.viewModels.prodAddReviewViewModel.resourceName !== undefined) {
                app.changeTitle(app.viewModels.prodAddReviewViewModel.resourceName);
            }
        },
        onAfterShow: function () {
            scriptsUtils.createRatingsComponent('create-review-rateit');
        },
        onInit: function (e) {
            try {
                // Create Data Source
                app.viewModels.prodAddReviewViewModel.createProdReviewsJSDO();
                app.views.listView = e.view;
            }
            catch (ex) {
                console.log("Error in initListView: " + ex);
            }
        },
        createProdReviewsJSDO: function () {
            //configuring JSDO Settings
            jsdoSettings.resourceName = 'dsProd';
            jsdoSettings.tableName = 'ProdReview';
            this.jsdoReviewsModel = new progress.data.JSDO({
                name: jsdoSettings.resourceName,
                autoFill: false,
            });
        },
        save: function (e) {
            try {
                var form = e.sender.element[0].closest('form');
                var validator = $(form).kendoValidator({
                    validateOnBlur: false
                }).data('kendoValidator');
                if (!validator.validate())
                    return;
                var rating = scriptsUtils.getRatingValue('.create-review-rateit', 32);
                if (rating == 0)
                    rating = 1;
                var prodReviewDet = {
                    "Prod_recno": app.viewModels.prodAddReviewViewModel.selectedProduct.Prod_Recno,
                    "cust_id": localStorage.getItem('selectedCustomer'),
                    "rating": rating,
                    "recommended": form.recommended.checked ? 'yes' : 'no',
                    "review_text": form.comments.value,
                    "web_user_id": app.viewModels.loginViewModel.username
                };
                var request = {
                    "dsProdReview": {
                        "ProdReview": [
                            {
                                "ProdReviewDet": [prodReviewDet]
                            }
                        ]
                    }
                };
                var promise = app.viewModels.prodAddReviewViewModel.jsdoReviewsModel.invoke(
                    'AddProdReview', request);
                promise.done(function (session, result, details) {
                    var errors = false;
                    try {
                        if (details.success)
                            errors = app.getErrors(details.response.dsProdReview.dsProdReview.wsReviewResult);
                        else {
                            errors = true;
                            MessageDialogController.showMessage('Adding the review failed', "Error");
                        }
                    } catch (e) {
                        errors = true;
                        MessageDialogController.showMessage('Adding the review failed', "Error");
                    }
                    if (errors)
                        return;
                    if (app.viewModels.prodAddReviewViewModel.successCallback) {
                        try {
                            app.viewModels.prodAddReviewViewModel.successCallback(prodReviewDet);
                        } catch (e) { }
                    }
                });
                promise.fail(function () {
                    MessageDialogController.showMessage('Adding the review failed', "Error");
                });
            } catch (e) { }
        },
        cancel: function () {
            app.back();
        },
    });
    parent.prodAddReviewViewModel = prodAddReviewViewModel;

})(app.viewModels);

var scriptsUtils = {
    createRatingsComponent: function (ratingClass) {
        $('.' + ratingClass).each(function (index, element) {
            var ratingValue = parseFloat(element.getAttribute('rating-value'));
            var ratingStep = parseFloat(element.getAttribute('step'));
            var elementObj = $(element);
            elementObj.rateit();
            elementObj.rateit('value', ratingValue);
            elementObj.rateit('step', ratingStep);
        });
    },
    getRatingValue: function (selector, startWidth) {
        try {
            var width = $(selector + ' .rateit-range .rateit-hover').width();
            return width / startWidth;
        } catch (e) {
            return NaN;
        }
    }
}
var MessageDialogController = (function () {
    var that = {};
    /**
     * Invokes the method 'fun' if it is a valid function. In case the function
     * method is null, or undefined then the error will be silently ignored.
     *
     * @param fun  the name of the function to be invoked.
     * @param args the arguments to pass to the callback function.
     */
    var invoke = function (fun, args) {
        if (fun && typeof fun === 'function') {
            fun(args);
        }
    };
    that.showMessage = function (message, title, buttonName) {
        title = title || "Information";
        buttonName = buttonName || 'OK';
        if (navigator.notification && navigator.notification.alert) {
            navigator.notification.alert(
                message,
                null,
                title,
                buttonName
            );
        } else {
            alert(message);
        }
    };
    that.showConfirm = function (message, callback, buttonLabels, title) {
        /*Set default values if not specified by the user.*/
        buttonLabels = buttonLabels || 'OK,Cancel';
        title = title || "Confirm";
        /*Use Cordova version of the confirm box if possible.*/
        if (navigator.notification && navigator.notification.confirm) {
            var _callback = function (index) {
                if (callback) {
                    /*The ordering of the buttons are different on iOS vs. Android.*/
                    /*if(navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
                        index = buttonList.length - index;
                    }*/
                    callback(index);
                }
            };
            navigator.notification.confirm(
                message,
                _callback,
                title,
                buttonLabels
            );
            /*Default to the usual JS confirm method.*/
        } else {
            invoke(callback, confirm(message));
        }
    };
    return that;
})();
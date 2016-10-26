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
    }
}
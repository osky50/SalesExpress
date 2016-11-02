(function (parent) {
    var followUsViewModel = kendo.observable({
        resourceName: 'Follow Us',
        onInit: function (e) {
            debugger;
            $(".facebook-info").attr('href', localStorage.getItem('facebookUrl'));
            $(".twitter-info").attr('href', localStorage.getItem("twitterUrl"));
        },
    });

    parent.followUsViewModel = followUsViewModel;

})(app.viewModels);


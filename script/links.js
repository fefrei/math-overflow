$(document).ready(function () {
    $(document).on("click", "a", function (event) {
        event.preventDefault();
        location.href = $(event.target).attr("href");
    });
});
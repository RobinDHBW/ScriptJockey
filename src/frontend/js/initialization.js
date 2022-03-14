"use strict"
$(document).ready(async () => {
    try {
        router.getStart();

        //Toggle message initialization process
        

        $('#searchInput').on('keyup', function () {
            const value = $(this).val().toLowerCase();
            $("#id3Table tr").filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            });
        });
    } catch (e) { console.error(e) }
})
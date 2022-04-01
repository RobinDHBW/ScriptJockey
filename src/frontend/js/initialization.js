"use strict"

/**
 * Hook - triggered, when  HTml page is fully loaded. Fetch data and build SPA
 */
$(document).ready(async () => {
    try {
        router.getStart();
        mainController.initPlaylist();        

        $('#searchInput').on('keyup', function () {
            const value = $(this).val().toLowerCase();
            $("#id3Table tr").filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            });
        });
    } catch (e) { console.error(e) }
})
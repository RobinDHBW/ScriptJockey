"use strict"
$(document).ready(async () => {
    try {
        router.getStart();

        //TODO do we need to ask for setup or just fetch the playlist --> Message if empty?
        // $.get("/", async (data, status) => {
        //     try {
        //         if (status === "success") {
                    
        //         }
        //     } catch (e) { console.error(e) }
        // })

        $('#searchInput').on('keyup', function () {
            const value = $(this).val().toLowerCase();
            $("#id3Table tr").filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            });
        });
    } catch (e) { console.error(e) }
})
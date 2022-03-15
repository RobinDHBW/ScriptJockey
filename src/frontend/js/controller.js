"use strict"
class MainController {
    #router;

    constructor(router) {
        this.#router = router
    }

    async errorMessage() {
        $("#spinning-sheep-gatter").attr('style', 'display: none !important');
        $("#main-body").append($(`<div id="fetchAlert" class='alert alert-danger'><strong>Error</strong> | Fetch data from server failed!</div>`))
    }

    async initPlaylist() {
        try {
            await this.#router.getStart();
            $("#automatedID3Table").empty();
            if ($("#fetchAlert")) {
                $("#fetchAlert").parent().find("#fetchAlert").remove();
            }

            $("#spinning-sheep-gatter").attr('style', 'display: flex !important');
            $.get("/fe/sync", async (data) => {
                try {
                    // console.log(data, status);
                    // const id3Array = JSON.parse(data);
                    $("#spinning-sheep-gatter").attr('style', 'display: none !important');
                    if (!Array.isArray(data)) throw new Error("Wrong datatype - Array needed!");
                    const tbody = $("#automatedID3Table");
                    data.forEach((item, index) => {
                        const tr = $("<tr class='id3table-row'></tr>").appendTo(tbody);
                        $(`<td class="text-center" id='${index}_title'>${item.track}</td>`).appendTo(tr);
                        $(`<td class="text-center" id='${index}_artist'>${item.artist}</td>`).appendTo(tr);
                        $(`<td class="text-center" id='${index}_album'>${item.album}</td>`).appendTo(tr);
                        $(`<td class="text-center" id='${index}_vote'>${item.votes}</td>`).appendTo(tr);

                        // // imageBuffer to blob - not properly working
                        // if (item.image) {
                        //     const arrayBufferView = new Uint8Array(item.image.imageBuffer);
                        //     const blob = new Blob([arrayBufferView], { type: "image/" + item.image.mime });
                        //     let imageUrl = window.URL.createObjectURL(blob);
                        //     $(`<td><img src='${imageUrl}'></td>`).appendTo(tr);
                        // }

                        tr.click(() => {
                            item.votes++;
                            $.post('/fe/upvote', {id: item.id}, async (data, status) => {
                                if (data === "done") {
                                    $('#' + index + '_vote').html(item.vote);
                                } else {
                                    item.votes--;
                                }
                            })
                        })
                    })
                } catch (e) {
                    console.error(e);
                    this.errorMessage();
                }
            }).fail(async () => {
                try {
                    throw new Error("Request failed!");
                } catch (error) {
                    console.error(error)
                    this.errorMessage();
                }
            });
        } catch (e) {
            console.error(e)
            this.errorMessage();

        }

    }

}
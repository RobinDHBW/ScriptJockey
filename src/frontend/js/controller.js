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

    async buildTable(data) {
        try {
            // console.log(data, status);
            // const id3Array = JSON.parse(data);
            $("#automatedID3Table").empty();
            $("#spinning-sheep-gatter").attr('style', 'display: none !important');
            if (!Array.isArray(data)) throw new Error("Wrong datatype - Array needed!");
            const tbody = $("#automatedID3Table");
            data.forEach((item, index) => {
                const tr = $("<tr class='id3table-row'></tr>").appendTo(tbody);
                $(`<td class="text-center" id='${index}-title'>${item.track}</td>`).appendTo(tr);
                $(`<td class="text-center" id='${index}-artist'>${item.artist}</td>`).appendTo(tr);
                $(`<td class="text-center" id='${index}-album'>${item.album}</td>`).appendTo(tr);
                $(`<td class="text-center" id='${index}-vote'>${item.votes}</td>`).appendTo(tr);

                // // imageBuffer to blob - not properly working
                // if (item.image) {
                //     const arrayBufferView = new Uint8Array(item.image.imageBuffer);
                //     const blob = new Blob([arrayBufferView], { type: "image/" + item.image.mime });
                //     let imageUrl = window.URL.createObjectURL(blob);
                //     $(`<td><img src='${imageUrl}'></td>`).appendTo(tr);
                // }

                tr.click(() => {
                    item.votes++;
                    $.post('/fe/upvote', { id: item.id }, async (data) => {
                        // try {
                        //     if (data === "done") {
                        //         $('#' + index + '-vote').html(item.votes);
                        //     } else {
                        //         item.votes--;
                        //     }
                        // } catch (e) {
                        //     console.error(e);
                        // }
                    })
                })
            })
        } catch (e) {
            console.error(e);
            this.errorMessage();
        }

    }

    async initPlaylist(force) {
        try {
            await this.#router.getStart();
            if ($("#fetchAlert")) {
                $("#fetchAlert").parent().find("#fetchAlert").remove();
            }

            $("#spinning-sheep-gatter").attr('style', 'display: flex !important');

            $.get("/fe/sync", { force }, async (data) => {
                try {
                    this.buildTable(data);
                    this.getActualPlaying();
                } catch (e) {
                    console.error(e);
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

    async getActualPlaying() {
        try {
            $.get("/player", async (data) => {
                try {
                    $("#currently-playing-container").attr('style', 'display: flex !important');
                    let artist = "";
                    for (const [i, item] of data.artists.entries()) {
                        const gap = i > 0 ? ", " : "";
                        artist += gap + item;
                    }
                    $("#currently-playing-text").text(`${artist} - ${data.track} | ${data.album}`);
                } catch (e) {
                    console.error(e);
                }
            }).fail(async () => {
                try {
                    throw new Error("Request failed!");
                } catch (error) {
                    console.error(error)
                    // this.errorMessage();
                }
            });
        } catch (error) {
            console.error(e)
            // this.errorMessage();
        }
    }

}
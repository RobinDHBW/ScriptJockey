"use strict"

class MainController {
    #router;
    #utils;
    #actualSong;
    #jumbotronExpanded;

    constructor(router, utils) {
        this.#router = router;
        this.#utils = utils;
        this.#jumbotronExpanded = false;
    }

    async errorMessage() {
        $("#spinning-sheep-gatter").attr('style', 'display: none !important');
        $("#main-body").append($(`<div id="fetchAlert" class='alert alert-danger'><strong>Error</strong> | Fetch data from server failed!</div>`))
    }

    async buildTable(data) {
        try {
            let mostvoted = { item: null, index: 0 };
            // console.log(data, status);
            // const id3Array = JSON.parse(data);
            $("#automatedID3Table").empty();
            $("#spinning-sheep-gatter").attr('style', 'display: none !important');
            if (!Array.isArray(data)) throw new Error("Wrong datatype - Array needed!");
            const tbody = $("#automatedID3Table");
            data.forEach((item, index) => {
                if (!mostvoted.item || mostvoted.item.votes < item.votes) {
                    mostvoted.item = item;
                    mostvoted.index = index;
                }
                const tr = $(`<tr id='tr-${index}' class='clickable'></tr>`).appendTo(tbody);
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
            $(`#tr-${mostvoted.index}`).addClass("next-song");
        } catch (e) {
            console.error(e);
            this.errorMessage();
        }

    }

    async buildJumbotron(data) {
        try {
            $("#currently-playing-container").attr('style', 'display: block !important');
            let artist = "";
            for (const [i, item] of data.artists.entries()) {
                const gap = i > 0 ? ", " : "";
                artist += gap + item;
            }
            $("#currently-playing-image").attr('src', data.images[2].url)
            $("#currently-playing-song").text(`${data.track}`);
            $("#currently-playing-meta").text(`${artist} | ${data.album}`);
        } catch (error) {
            console.error(error);
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
                    this.#actualSong = data;
                    this.buildJumbotron(data);
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

    async getLyrics(force) {
        try {
            if (!force) this.#jumbotronExpanded = !this.#jumbotronExpanded;
            if (!this.#actualSong) throw new Error("No Song defined to crawl lyrics for");

            if (!this.#jumbotronExpanded) {
                $("#lyric-container").empty();
                return;
            }

            $.get("/lyrics/", { title: this.#actualSong.track, artist: this.#actualSong.artists[0] }, async (data) => {
                try {
                    $("#lyric-container").empty();
                    $("#lyric-container").append(`<span>${data.lyrics || "Error | No lyrics found!"}</span>`)
                } catch (e) {
                    console.error(e);
                }
            }).fail(async () => {
                try {
                    throw new Error("Request failed!");
                } catch (error) {
                    console.error(error)
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    async setActualSong(data) {
        try {
            this.#actualSong = data;
        } catch (error) {
            console.error(error);
        }
    }

    async getActualSong() {
        try {
            return this.#actualSong;
        } catch (error) {
            console.error(error);
        }
    }

    async getLyricExpanded() {
        try {
            return this.#jumbotronExpanded;
        } catch (error) {
            console.error(error);
        }
    }

}
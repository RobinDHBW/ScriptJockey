"use strict"

/**
 * Main Controller for SPA-Coordination and DOM-Manipulation
 */
class MainController {
    #router;
    #utils;
    #actualSong;
    #jumbotronExpanded;

    /**
     * new MainController
     * @param {Object} router - Reference of Router instance 
     * @param {Object} utils - Reference of Utils instance
     */
    constructor(router, utils) {
        this.#router = router;
        this.#utils = utils;
        this.#jumbotronExpanded = false;
    }

    /**
     * DOM-Manipulation to display alert
     * @returns {Promise}
     */
    async errorMessage() {
        $("#automatedID3Table").empty();
        $("#spinning-sheep-gatter").attr('style', 'display: none !important');
        $("#currently-playing-container").attr('style', 'display: none; !important');
        $("#main-body").append($(`<div id="fetchAlert" class='alert alert-warning'><strong>Loading...</strong> | Get a drink and relax. Party is starting soon <i class="bi bi-hourglass-split"></i></div>`))
    }

    /**
     * DOM-Manipulation to display a HTML-Table on base of a playlist
     * @param {Array} data - Array of PlaylistItems
     * @returns {Promise}
     */
    async buildTable(data) {
        try {
            if (!Array.isArray(data) || data.length === 0) throw new Error("Playlist empty!");
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

                tr.click(() => {
                    item.votes++;
                    $.post('/fe/upvote', { id: item.id });
                })
            })
            $(`#tr-${mostvoted.index}`).addClass("next-song");
        } catch (e) {
            console.error(e);
            this.errorMessage();
        }

    }

    /**
     * DOM-Manipulation to display a Bootstrap5 Jumbotron for current song
     * @param {Object} data - single PlaylistItem
     * @returns {Promise}
     */
    async buildJumbotron(data) {
        try {
            if (!data || !data.track_id) throw new Error("No Song playing!");
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
            $("#currently-playing-container").attr('style', 'display: none; !important');
            console.error(error);
        }
    }

    /**
     * Display loading-spinner and fetch Playlist - coordinate table building from data
     * @param {boolean} force - true forces the backend to resynchronize the playlist from spotify
     * @returns {Promise}
     */
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

    /**
     * Fetch actual song and coordinate jumbotron building
     * @returns {Promise}
     */
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

    /**
     * Fetch lyrics to actual sonng and coordinate Jumbotron expanding
     * @param {boolean} dataUpdate - If true the Jumbotron stays in actual displayed expandation state
     * @returns {Promise}
     */
    async getLyrics(dataUpdate) {
        try {
            if (!dataUpdate) this.#jumbotronExpanded = !this.#jumbotronExpanded;
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

    /**
     * Setter for private Attrbiut #actualSong
     * @param {Object} data - single PlaylistItem
     * @returns {Promise}
     */
    async setActualSong(data) {
        try {
            this.#actualSong = data;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Getter for private Attrbiut #actualSong
     * @returns {Promise}
     * @returns {Object} - single PlaylistItem
     */
    async getActualSong() {
        try {
            return this.#actualSong;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Getter for private Attrbiut #jumbotronExpanded
     * @returns {boolean} - if true Jumbotron is expanded for lyrics
     */
    async getLyricExpanded() {
        try {
            return this.#jumbotronExpanded;
        } catch (error) {
            console.error(error);
        }
    }

}
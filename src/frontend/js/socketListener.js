"use strict"

class SocketIOListener {
    #socket
    #mainController
    #router;
    #utils;

    /**
     * 
     * @param {socket.io} socket 
     * @param {MainController} controller 
     * @param {Scratcher} router 
     * @param {Utils} utils 
     */
    constructor(socket, controller, router, utils) {
        this.#socket = socket;
        this.#mainController = controller;
        this.#router = router;
        this.#utils = utils;

        this.#socket.on("update_playlist", (data) => {
            this.#mainController.buildTable(data);
        })

        /**
         * WebSocket event listener - "update_current_song"
         */
        this.#socket.on("update_current_song", async (data) => {
            try {
                const currentSong = await this.#mainController.getActualSong();
                if (currentSong && currentSong.track_id === data.track_id) return;
                this.#mainController.setActualSong(data);
                this.#mainController.buildJumbotron(data);
                if (await this.#mainController.getLyricExpanded()) this.#mainController.getLyrics(true);
            } catch (error) {
                console.error(error);
            }
        })

        /**
         * WebSocket event listener - "spotify_auth_finished_successful"
         */
        this.#socket.on("spotify_auth_finished_successful", () => {
            this.#router.getBackroom();
            if ($("#fetchAlert")) {
                $("#fetchAlert").parent().find("#fetchAlert").remove();
            }
        })

        /**
         * WebSocket event listener - "spotify_auth_finished_failure"
         */
        this.#socket.on("spotify_auth_finished_failure", (error) => {
            this.#router.getBackroom();
            $("#main-body").append($(`<div id="fetchAlert" class='alert alert-danger'><strong>Error</strong> | Spotify-Login failed: ${error.message}</div>`))
        })


        /**
         * WebSocket event listener - "dj_in_the_house"
         */
        this.#socket.on("dj_in_the_house", async (data) => {
            if (data && !(await this.#utils.getCookieValue("dj_in_the_House"))) {
                $("#im-the-dj").attr('style', 'display: none !important');
            }
        })

    }
}
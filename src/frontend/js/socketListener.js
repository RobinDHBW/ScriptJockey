"use strict"

class SocketIOListener {
    #socket
    #mainController
    #router;
    #utils;
    constructor(socket, controller, router, utils) {
        this.#socket = socket;
        this.#mainController = controller;
        this.#router = router;
        this.#utils = utils;

        this.#socket.on("update_playlist", (data) => {
            this.#mainController.buildTable(data);
        })

        this.#socket.on("spotify_auth_finished_successful", (data) => {
            this.#router.getBackroom();
            if ($("#fetchAlert")) {
                $("#fetchAlert").parent().find("#fetchAlert").remove();
            }
        })

        this.#socket.on("spotify_auth_finished_failure", (error) => {
            this.#router.getBackroom();
            $("#main-body").append($(`<div id="fetchAlert" class='alert alert-danger'><strong>Error</strong> |Spotify-Login failed: ${error.message}</div>`))
        })

        this.#socket.on("dj_in_the_house", async (data) => {
            if (data && !(await this.#utils.getCookieValue("spotify_auth_state"))) {
                $("#im-the-dj").attr('style', 'display: none !important');
            }
        })

    }
}
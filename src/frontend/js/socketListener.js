"use strict"

class SocketIOListener {
    #socket
    #mainController
    #router;
    constructor(socket, controller, router) {
        this.#socket = socket;
        this.#mainController = controller;
        this.#router = router;

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
    }
}
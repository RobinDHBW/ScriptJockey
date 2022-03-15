"use strict"

class SocketIOListener {
    #socket
    #mainController
    constructor(socket, controller) {
        this.#socket = socket;
        this.#mainController = controller;

        this.#socket.on("update_playlist", (data) => {
            this.#mainController.buildTable(data);
        })
    }
}
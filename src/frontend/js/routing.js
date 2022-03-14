"use strict"

class Scratcher {

    constructor() {
    }

    async #appendToMain(data) {
        $("#main-body").empty();
        $("#main-body").append(data);
    }

    /**
     * 
     */
    async getStart() {
        try {
            $.get("/fe/start", async (data, status) => {
                try {
                    if (status === "success") {
                        this.#appendToMain(data);
                    }
                } catch (e) { console.error(e) }
            })
        } catch (e) { console.error(e) }
    }

    /**
     * 
     */
    async getBackroom() {
        try {
            $.get("/fe/backroom-poker", async (data, status, xhr) => {
                try {
                    if (status === "success" && xhr.status === 250) {
                        const win = window.open(data, "_self");
                        if (win) win.focus();
                    } else if (status === "success") {
                        this.#appendToMain(data);
                    }
                } catch (e) { console.error(e) }
            })
        } catch (e) { console.error(e) }
    }   

}
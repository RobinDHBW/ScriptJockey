"use strict"

class Scratcher {

    constructor() {
    }

    /**
     * 
     * @param {DOM} data - HTML DOM Element to put into container
     */
    async #appendToMain(data) {
        $("#main-body").empty();
        $("#main-body").append(data);
    }

    /**
     * Get DOM Data from Backend
     */
    async getStart() {
        try {
            const result = await $.get("/fe/start");
            this.#appendToMain(result);
        } catch (e) { console.error(e) }
    }

    /**
     * Get DOM Data from Backend
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
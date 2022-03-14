"use strict"
class Scratcher {

    constructor() {
    }

    async #appendToMain(data) {
       // this.#mainElement.empty();
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
            $.get("/fe/backroom-poker", async (data, status) => {
                try {
                    if (status === "success") {
                        this.#appendToMain(data);
                    }
                } catch (e) { console.error(e) }
            })
        } catch (e) { console.error(e) }
    }

}
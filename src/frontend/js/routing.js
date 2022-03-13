class Router {
    #mainElement;

    constructor() {
        this.#mainElement = $("main-body");
    }

    async #appendToMain(data) {
        this.#mainElement.empty();
        this.#mainElement.append(data);
    }

    /**
     * 
     */
    async getStart() {
        try {
            $.get("/start", async (data, status) => {
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
            $.get("/backroom-poker", async (data, status) => {
                try {
                    if (status === "success") {
                        this.#appendToMain(data);
                    }
                } catch (e) { console.error(e) }
            })
        } catch (e) { console.error(e) }
    }

}
class Utils {
    constructor() {

    }

    /**
     * Load Cookie
     * @param {string} name  - Cookie name
     * @returns Promise
     * @returns Cookie valuestring
     */
    async getCookieValue(name) {
        return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
    }

    /**
     * Set Cookie
     * @param {string} key - cookie key name
     * @param {any} value - cookie value
     * @param {number} expiry_days - TTL
     */
    async setCookieValue(key, value, expiry_days) {
        try {
            const d = new Date();
            d.setTime(d.getTime() + (expiry_days * 24 * 60 * 60 * 1000));
            let expires = "expires=" + d.toUTCString();
            document.cookie = key + "=" + value + ";" + expires + ";path=/";
        } catch (e) {
            console.error(e);
        }
    }
}
class Utils {
    constructor() {

    }

    async getCookieValue(name) {
        return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
    }

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
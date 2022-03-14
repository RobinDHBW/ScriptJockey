
export class GeniusApi {
    access_token: string;
    genius: any;
    axios: any;

    constructor() {
        this.access_token = 'NKnToKeJnL4ob1MrUEvLZw3laYzvs-CBDVxjIXg7JFRZZdQ_KR5_DSN9WAdufc6I';
        this.genius = require('genius-lyrics-api');
        this.axios = require('axios');
    }

    /**
     * Removes special expressions from the song title
     * @param  {string} length The title of the song
     * @return {string} The new song title
     */
    formatTitle(title: string) {
        title = title.replace("feat.", "");
        title = title.replace("ft.", "");
        title = title.replace(/&/g, "");
        var i3 = title.indexOf("-");
        if (i3 >= 0)
            title = title.replace(title.substring(i3), "");
        title = title.replace("remix", "");
        title = title.replace(/  /g, " ");
        return title;
    }

    /**
     * Removes content in brackets from the song title
     * @param  {string} title The title of the song
     * @return {string} The title without the brackets
     */
    shortTitle(title: string) {
        var i1 = title.indexOf("(");
        var i2 = title.indexOf(")");
        title = title.replace(")", "");
        title = title.replace("(", "");
        if (i1 >= 0 && i2 >= 0)
            title = title.replace(title.substring(i1 - 1, i2 - 1), "");
        return title;
    }

    /**
     * Removes special expressions from the song artist
     * @param  {string} artist The artist of the song
     * @return {string} The new artist
     */
    formatArtist(artist: string) {
        artist = artist.replace(/å/g, "a");
        artist = artist.replace(/&/g, " ");
        return artist;
    }

    /**
     * Returns the words of the song in arrays with and without words in brackets
     * @param  {string} title The title of the song
     * @return {string[], string[]} the words of the song with parts in brackets and without parts in bracket
     */
    getTitleparts(title: string) {
        var i1 = title.indexOf("(");
        var i2 = title.indexOf(")");
        title = title.replace(")", "");
        title = title.replace("(", "");
        var titlePartsWithBrackets = title.split(" ");;
        if (i1 >= 0 && i2 >= 0)
            title = title.replace(title.substring(i1 - 1, i2 - 1), "");
        var titleparts = title.split(" ");
        return { titlePartsWithBrackets, titleparts };
    }

    /**
     * Check, wether title from genius-api contains all words from title in url
     * @param  {string} geniusTitle The song title the genius-api returned
     * @param  {string[]} titlePartsWithBrackets All words of the song title from the url
     * @param  {string[]} titleParts words of the song title from the url without parts in brackets
     * @return {boolean} True, if title from genius-api contains all words from title in url
     */
    containsTitleparts(geniusTitle: string, titlePartsWithBrackets: string[], titleparts: string[]) {
        var gtitle = geniusTitle.toLowerCase();
        gtitle = gtitle.replace(/'/g, "");
        gtitle = gtitle.replace(/’/g, "");

        for (var i = 0; i < titleparts.length; i++) {
            if (gtitle.includes(titleparts[i]))
                if (i == titleparts.length - 1)
                    return true;
        }
        for (var i = 0; i < titlePartsWithBrackets.length; i++) {
            if (!gtitle.includes(titlePartsWithBrackets[i]))
                return false;
        }
        return true;
    }

    /**
     * Check, wether artist from genius-api contains all words from artist in url
     * @param  {string} geniusArtist The song title the genius-api returned
     * @param  {string} urlArtist artist of the song given by url
     * @return {boolean} True, if artist from genius-api contains all words from artist in url
     */
    containsArtist(geniusArtist: string, urlArtist: string) {
        geniusArtist = geniusArtist.toLowerCase().replace(/å/g, "a");
        var artistparts = urlArtist.split(" ");
        for (var i = 0; i < artistparts.length; i++) {
            if (!geniusArtist.includes(artistparts[i]))
                return false
        }
        return true;
    }

    /**
     * Get song lyrics by searching for artist and title from genius-api, song have to contain
     * all words of title and artist, searching with words in brackets and without, if necessary
     * @param  {any} req Url request containing song title and artist
     * @return {Object} Status code and lyrics when found, otherwise status code and error message
     */
    async getLyrics(req: any) {
        try {
            var title = req.params.title.toLowerCase();
            var artist = req.params.artist.toLowerCase();
            artist = this.formatArtist(artist);
            title = title.replace(/'/g, "");
            title = title.replace(/’/g, "");
            var url = "https://api.genius.com/search?q=" + title + "%20" + artist + "&access_token=" + this.access_token;
            var response = await this.axios.get(url);
            var hits = response.data.response.hits;
            title = this.formatTitle(title);
            var parts = this.getTitleparts(title);
            for (var i = 0; i < hits.length; i++) {
                if (this.containsArtist(hits[i].result.artist_names, artist) && this.containsTitleparts(hits[i].result.full_title, parts.titlePartsWithBrackets, parts.titleparts)) {
                    var lyricurl = "https://genius.com" + hits[i].result.path;
                    var lyric = await this.genius.getLyrics(lyricurl);
                    return {
                        lyrics: lyric
                    };
                }
            }

            url = "https://api.genius.com/search?q=" + this.shortTitle(title) + "%20" + artist + "&access_token=" + this.access_token;
            response = await this.axios.get(url);
            hits = response.data.response.hits;
            for (var i = 0; i < hits.length; i++) {

                if (this.containsArtist(hits[i].result.artist_names, artist) && this.containsTitleparts(hits[i].result.full_title, parts.titlePartsWithBrackets, parts.titleparts)) {
                    var lyricurl = "https://genius.com" + hits[i].result.path;
                    var lyric = await this.genius.getLyrics(lyricurl);
                    return {
                        lyrics: lyric
                    };
                }

            }
            return {
                lyrics: null
            };

        } catch (error) {
            return {
                lyrics: null
            }
        }

    }
}
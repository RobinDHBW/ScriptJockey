
export class GeniusApi {
    access_token: string;
    genius: any;
    axios: any;

    constructor() {
        this.access_token = 'NKnToKeJnL4ob1MrUEvLZw3laYzvs-CBDVxjIXg7JFRZZdQ_KR5_DSN9WAdufc6I';
        this.genius = require('genius-lyrics-api');
        this.axios = require('axios');
    }

    /*
    /  
    /
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

    shortTitle(title: string) {
        var i1 = title.indexOf("(");
        var i2 = title.indexOf(")");
        title = title.replace(")", "");
        title = title.replace("(", "");
        if (i1 >= 0 && i2 >= 0)
            title = title.replace(title.substring(i1 - 1, i2 - 1), "");
        return title;
    }

    formatArtist(artist: string) {
        artist = artist.replace(/å/g, "a");
        artist = artist.replace(/&/g, " ");
        return artist;
    }

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

    containsArtist(geniusArtist: string, urlArtist: string) {
        geniusArtist = geniusArtist.toLowerCase().replace(/å/g, "a");
        var artistparts = urlArtist.split(" ");
        for (var i = 0; i < artistparts.length; i++) {
            if (!geniusArtist.includes(artistparts[i]))
                return false
        }
        return true;
    }

    async getLyrics(req: any, res: any) {
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
                        status: 200,
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
                        status: 200,
                        lyrics: lyric
                    };
                }

            }
            return {
                status: 404,
                message: "title not found"
            };

        } catch (error) {
            return {
                status: 404,
                message: error.message
            }
        }

    }
}


/*
const gApiAccess = new GeniusApi();
app = express();
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.static(__dirname + '/public'))
    .use(cors());

app.get('/lyrics/:title/:artist', async function(req, res) {
    try {
        var title = req.params.title.toLowerCase();
        var artist = req.params.artist.toLowerCase();
        artist = gApiAccess.formatArtist(artist);
        title = title.replace(/'/g, "");
        title = title.replace(/’/g, "");

        const url = "https://api.genius.com/search?q=" + title + "%20" + artist + "&access_token=" + access_token;
        const response = await axios.get(url);
        const hits = response.data.response.hits;
        title = gApiAccess.formatTitle(title);
        parts = gApiAccess.getTitleparts(title);
        var noLyrics = true;
        for (var i = 0; i < hits.length; i++) {
            if (gApiAccess.containsArtist(hits[i].result.artist_names, artist) && gApiAccess.containsTitleparts(hits[i].result.full_title, parts.titlePartsWithBrackets, parts.titleparts)) {
                var lyricurl = "https://genius.com" + hits[i].result.path;
                console.log(hits[i].result.path)
                genius.getLyrics(lyricurl).then((lyrics) => res.status(200).json({
                    status: 200,
                    lyrics: lyrics
                }));
                noLyrics = false;
                break;
            }
        }
        if (noLyrics) {
            const url = "https://api.genius.com/search?q=" + gApiAccess.shortTitle(title) + "%20" + artist + "&access_token=" + access_token;
            const response = await axios.get(url);
            const hits = response.data.response.hits;
            for (var i = 0; i < hits.length; i++) {
                console.log(hits[i].result.full_title)

                if (gApiAccess.containsArtist(hits[i].result.artist_names, artist) && gApiAccess.containsTitleparts(hits[i].result.full_title, parts.titlePartsWithBrackets, parts.titleparts)) {
                    var lyricurl = "https://genius.com" + hits[i].result.path;
                    genius.getLyrics(lyricurl).then((lyrics) => res.status(200).json({
                        status: 200,
                        lyrics: lyrics
                    }));
                    noLyrics = false;
                    break;
                }
            }
        }
        if (noLyrics) {
            res.status(404).json({
                status: 404,
                message: "title not found"
            });
        }

    } catch (error) {
        console.log(error)
        res.status(404).json({
            status: 404,
            message: error.message
        });
    }
});
console.log('Listening on 8888');
app.listen(8888);

/*
            const genius = require('genius-lyrics-api');
            const express = require('express'); // Express web server framework
            const cors = require('cors');
            const axios = require('axios');
            const swaggerUi = require('swagger-ui-express');
            const swaggerDocument = require('./genius-openapi.json');


            var access_token = 'NKnToKeJnL4ob1MrUEvLZw3laYzvs-CBDVxjIXg7JFRZZdQ_KR5_DSN9WAdufc6I';

            var app = express();
            app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

            app.use(express.static(__dirname + '/public'))
                .use(cors());

            app.get('/lyrics/:title/:artist', async function(req, res) {
                try {
                    var title = req.params.title.toLowerCase();
                    var artist = req.params.artist.toLowerCase();
                    title = title.replace(/'/g, "");
                    title = title.replace(/’/g, "");
                    const url = "https://api.genius.com/search?q=" + title + "%20" + formatArtist(artist) + "&access_token=" + access_token;
                    const response = await axios.get(url);
                    const hits = response.data.response.hits;
                    var noLyrics = true;
                    for (var i = 0; i < hits.length; i++) {
                        if (containsArtist(hits[i].result.artist_names, artist) && containsTitleparts(hits[i].result.full_title, title)) {
                            var lyricurl = "https://genius.com" + hits[i].result.path;
                            genius.getLyrics(lyricurl).then((lyrics) => res.status(200).json({
                                status: 200,
                                lyrics: lyrics
                            }));
                            noLyrics = false;
                            break;
                        }
                    }
                    if (noLyrics) {
                        const url = "https://api.genius.com/search?q=" + formatTitle(title) + "%20" + formatArtist(artist) + "&access_token=" + access_token;
                        const response = await axios.get(url);
                        const hits = response.data.response.hits;
                        for (var i = 0; i < hits.length; i++) {
                            if (containsArtist(hits[i].result.artist_names, artist) && containsTitleparts(hits[i].result.full_title, title)) {
                                var lyricurl = "https://genius.com" + hits[i].result.path;
                                genius.getLyrics(lyricurl).then((lyrics) => res.status(200).json({
                                    status: 200,
                                    lyrics: lyrics
                                }));
                                noLyrics = false;
                                break;
                            }
                        }
                    }
                    if (noLyrics) {
                        console.log("title not found")
                        res.status(404).json({
                            status: 404,
                            message: "title not found"
                        });
                    }

                } catch (error) {
                    console.log(error)
                    res.status(404).json({
                        status: 404,
                        message: error.message
                    });
                }

                function formatTitle(title) {
                    title = title.replace("feat.", "");
                    title = title.replace("ft.", "");
                    title = title.replace(/&/g, "");
                    var i3 = title.indexOf("-");
                    if (i3 >= 0)
                        title = title.replace(title.substring(i3), "");
                    title = title.replace("remix", "");
                    title = title.replace(/  /g, " ");
                    var i1 = title.indexOf("(");
                    var i2 = title.indexOf(")");
                    title = title.replace(")", "");
                    title = title.replace("(", "");
                    if (i1 >= 0 && i2 >= 0)
                        title = title.replace(title.substring(i1 - 1, i2 - 1), "");
                    return title;
                }

                function formatArtist(artist) {
                    artist = artist.replace(/å/g, "a");
                    artist = artist.replace(/&/g, " ");
                    return artist;
                }

                function containsTitleparts(geniusTitle, urlTitle) {
                    var title = urlTitle;
                    title = title.replace("feat.", "");
                    title = title.replace("ft.", "");
                    title = title.replace(/&/g, "");
                    var i3 = title.indexOf("-");
                    if (i3 >= 0)
                        title = title.replace(title.substring(i3), "");
                    title = title.replace(/'/g, "");
                    title = title.replace(/’/g, "");
                    title = title.replace("remix", "");
                    title = title.replace(/  /g, " ");
                    var i1 = title.indexOf("(");
                    var i2 = title.indexOf(")");
                    title = title.replace(")", "");
                    title = title.replace("(", "");
                    var titlePartsWithBrackets = title.split(" ");;
                    if (i1 >= 0 && i2 >= 0)
                        title = title.replace(title.substring(i1 - 1, i2 - 1), "");
                    var titleparts = title.split(" ");
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

                function containsArtist(geniusArtist, urlArtist) {
                    urlArtist = formatArtist(urlArtist);
                    geniusArtist = geniusArtist.toLowerCase().replace(/å/g, "a");
                    var artistparts = urlArtist.split(" ");
                    for (var i = 0; i < artistparts.length; i++) {
                        if (!geniusArtist.includes(artistparts[i]))
                            return false
                    }
                    return true;
                }
            });

           
        
        */
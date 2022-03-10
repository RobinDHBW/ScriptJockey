import axios from "axios";
import { SpotifyPlaybackSDK } from "spotify-playback-sdk-node";

export class Spotify {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    access_token: string;
    refresh_token: string;
    playlistContent: Array<Object>;
    device_id: string;
    stateKey: string;

    constructor() {
        this.client_id = "5c29ae1655bb457e9386f9f233ff3091"; // Your client id
        this.client_secret = "c6c05a2783c449418dafe503a3441a4b"; // Your secret
        this.redirect_uri = "http://localhost:8080/callback"; // Your redirect uri
        this.playlistContent = new Array<Object>();
        //this.redirect;
        this.device_id = "736893c70c440b9e727b17ad95cfa8fc8d52e959";
        //this.device_id = "9bd9d72d9d1fde992f9ff70832230b8a1898f45e";
        //this.device_id = "14fddc193f451b8dcb01daf0982afd8d4c94bd23";
        this.stateKey = "spotify_auth_state";
    }

    test = async function () {
        var _this = this;
        const spotify = new SpotifyPlaybackSDK();
        await spotify.init();

        const player = await spotify.createPlayer({
            name: "Web",
            getOAuthToken() {
                return _this.access_token;
            },
        });


        const stream = await player.getAudio();
        const connected = await player.connect();
        if (!connected) throw "couldn't connect";

        player.on("ready", console.log);
        player.on("not_ready", console.log);
        player.on("player_state_changed", console.log);
        player.on("initialization_error", console.log);
        player.on("authentication_error", console.log);
        player.on("account_error", console.log);
        player.on("playback_error", console.log);


        console.log("connected", stream);
    }

    getAccessToken = function () {
        return this.access_token;
    }

    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    generateRandomString = function (length: number) {
        var text = "";
        var possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        return text;
    };

    /*var app = express();
    app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
	
    app.use(express.static(__dirname + '/public'))
        .use(cors())
        .use(cookieParser());*/

    login = function (state: string) {
        //var state = this.generateRandomString(16);
        //res.cookie(stateKey, state);

        // your application requests authorization
        var scope =
            "user-read-private user-read-email playlist-read-private user-read-playback-state user-modify-playback-state streaming";

        var url = new URLSearchParams({
            response_type: "code",
            client_id: this.client_id,
            scope: scope,
            redirect_uri: this.redirect_uri,
            state: state,
        });
        return url;
    };

    callback = async function (code: any) {
        // your application requests refresh and access tokens
        // after checking the state parameter
        var url = "https://accounts.spotify.com/api/token";
        var authOptions = {
            url: url,
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        this.client_id + ":" + this.client_secret
                    ).toString("base64"),
            },
            json: true,
        };

        var body = new URLSearchParams({
            code: code,
            redirect_uri: this.redirect_uri,
            grant_type: "authorization_code",
        });

        const response = await axios.post(
            url,
            body.toString(),
            authOptions
        );

        //console.log(response.data);

        if (!response.data.error && response.status === 200) {
            this.access_token = response.data.access_token;
            this.refresh_token = response.data.refresh_token;

            var options = {
                url: "https://api.spotify.com/v1/me",
                headers: { Authorization: "Bearer " + this.access_token },
                json: true,
            };
            // use the access token to access the Spotify Web API
            const response2 = await axios.get(
                "https://api.spotify.com/v1/me",
                options
            );
            console.log(response2.data);

            // we can also pass the token to the browser to make requests from there
            var redirectUrl = new URLSearchParams({
                access_token: this.access_token,
                refresh_token: this.refresh_token,
            });
        } else {
            var redirectUrl = new URLSearchParams({ error: "invalid_token" });
        }
        return redirectUrl;
    };

    refreshToken = async function (refresh_token: any) {
        this.refresh_token = refresh_token || this.refresh_token;
        var url = "https://accounts.spotify.com/api/token";
        var authOptions = {
            url: url,
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        this.client_id + ":" + this.client_secret
                    ).toString("base64"),
            },
            json: true,
        };
        var body = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: this.refresh_token,
        });

        const response = await axios.post(
            url,
            body.toString(),
            authOptions
        );

        if (!response.data.error && response.status === 200) {
            this.access_token = response.data.access_token;
            return this.access_token;
        }
    };

    getPlaylist = async function (id: string) {
        this.playlistContent = new Array<Object>();
        var _this = this;
        var hasNext = true;
        var url =
            "https://api.spotify.com/v1/playlist/" +
            id +
            "/tracks?limit=100&offset=0";

        while (hasNext) {
            var options = {
                url: url,
                headers: { Authorization: "Bearer " + this.access_token },
                json: true,
            };

            const response = await axios.get(url, options);
            if (!response.data.next) {
                hasNext = false;
            } else {
                url = response.data.next;
            }

            if (response.data.items !== undefined) {
                response.data.items.forEach(function (item: any) {
                    const artists = Array<string>();
                    item.track.artists.forEach((artist: any) =>
                        artists.push(artist.name)
                    );
                    _this.playlistContent.push({
                        track: item.track.name,
                        id: item.track.id,
                        artist: artists,
                        album: item.track.album.name,
                        duration: _this.calculateDuration(item.track.duration_ms)
                    });
                });
            }
        }
        return _this.playlistContent;
    };

    calculateDuration = function (duration: number) {
        return (
            Math.trunc(duration / 60000) +
            ":" +
            Math.round((duration / 60000 - Math.trunc(duration / 60000)) * 60)
                .toString(10)
                .padStart(2, "0")
        );
    };

    setDeviceId = function (id: string) {
        this.device_id = id;
    }

    getUserPlaylists = async function (id: string) {
        var playlists = Array<any>();
        var url = "https://api.spotify.com/v1/users/" + id + "/playlists";
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.get(url, options);
        response.data.items.forEach(function (item: any) {
            playlists.push({
                name: item.name,
                description: item.description,
                id: item.id,
                tracks: item.tracks.total,
                owner: item.owner.display_name,
            });
        });
        return playlists;
    };

    searchTrack = async function (track: string, artist: string) {
        var _this = this;
        var result;
        const artists = Array<string>();
        if (!artist) {
            var url =
                "https://api.spotify.com/v1/search/?q=track:" +
                track +
                "&type=track";
        } else {
            var url =
                "https://api.spotify.com/v1/search/?q=track:" +
                track + '+artist:' + artist +
                "&type=track";
        }

        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.get(url, options);

        response.data.tracks.items[0].artists.forEach((artist: any) =>
            artists.push(artist.name)
        );
        result = {
            track: response.data.tracks.items[0].name,
            id: response.data.tracks.items[0].id,
            artists: artists,
            album: response.data.tracks.items[0].album.name,
            duration: _this.calculateDuration(
                response.data.tracks.items[0].duration_ms
            ),
        };
        return result;
    };

    getPlayer = async function () {
        var _this = this;
        var currentlyPlaying = new Object();
        const artists = new Array<string>();
        var url = "https://api.spotify.com/v1/me/player";
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.get(url, options);

        if (response.data) {
            response.data.item.artists.forEach((artist: any) =>
                artists.push(artist.name)
            );

            currentlyPlaying = {
                track: response.data.item.name,
                track_id: response.data.item.id,
                device: response.data.device.name,
                device_id: response.data.device.id,
                artists: artists,
                album: response.data.item.album.name,
                duration: _this.calculateDuration(response.data.item.duration_ms),
                progress: _this.calculateDuration(response.data.progress_ms),
                isPlaying: response.data.is_playing
            };
            return currentlyPlaying;
        }
        else {
            return { message: "no active device, use /switchPlayer/{device_id} to switch your Player" }
        }
    };

    pausePlayer = async function () {
        var url =
            "https://api.spotify.com/v1/me/player/pause?device_id=" +
            this.device_id;
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.put(url, null, options);

        return {
            message: "successfully paused",
        };
    };

    playPlayer = async function () {
        var url =
            "https://api.spotify.com/v1/me/player/play?device_id=" +
            this.device_id;
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.put(url, null, options);

        return {
            message: "successfully played"
        };
    };

    transferPlayback = async function (id: string) {
        var url = "https://api.spotify.com/v1/me/player";
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };
        var body = {
            "device_ids": [
                id
            ],
            play: true
        }

        const response = await axios.put(url, body, options);

        this.device_id = id;
        return {
            message: "playback switched"
        };
    }

    /*currentlyPlaying = async function() {
        var url = "https://api.spotify.com/v1/me/player/currently-playing";
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };
        const response = await axios.get(url, options);
        return response.data; 
    }*/

    addTracktoQueue = async function (id: string) {
        var url =
            "https://api.spotify.com/v1/me/player/queue?uri=spotify:track:" +
            id +
            "&device_id=" +
            this.device_id;
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.post(url, null, options);

        return {
            message: "successfully added to queue",
        };
    };

    nextTrack = async function () {
        var url =
            "https://api.spotify.com/v1/me/player/next?device_id=" +
            this.device_id;
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.post(url, null, options);

        return {
            message: "successfully skipped",
        };
    };

    previousTrack = async function () {
        var url =
            "https://api.spotify.com/v1/me/player/previous?device_id=" +
            this.device_id;
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.post(url, null, options);

        return {
            message: "successfully jumped back",
        };
    };

    setRepeatMode = async function (mode: string) {
        var url =
            "https://api.spotify.com/v1/me/player/repeat?state=" +
            mode +
            "&device_id=" +
            this.device_id;
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.put(url, null, options);

        return {
            message: "set repeat-mode successfully to " + mode,
        };
    };

    setVolume = async function (volume: string) {
        var url =
            "https://api.spotify.com/v1/me/player/volume?volume_percent=" +
            volume +
            "&device_id=" +
            this.device_id;
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.put(url, null, options);

        return {
            message: "successfully changed volume to " + volume + "%",
        };
    };

    getDevices = async function () {
        var url = "https://api.spotify.com/v1/me/player/devices";
        var options = {
            url: url,
            headers: { Authorization: "Bearer " + this.access_token },
            json: true,
        };

        const response = await axios.get(url, options);
        //this.device_id = response.data.device.id;
        return response.data;
    };
}
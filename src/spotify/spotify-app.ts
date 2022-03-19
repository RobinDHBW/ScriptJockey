import axios from "axios";

export class Spotify {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    access_token: string;
    refresh_token: string;
    playlistContent: Array<any>;
    device_id: string;
    stateKey: string;
    currentlyPlaying: any;
    songWithMostVotes: any;
    lastSongAdded: any;
    duration_ms: number;
    progress_ms: number;
    eventEmitter: any;
    timer: any;


    constructor(address: string, eventEmitter: any) {
        const addressJSON = JSON.parse(address);
        this.client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
        this.client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
        this.redirect_uri = "http://" + addressJSON.address + ":" + addressJSON.port + "/callback"; // Your redirect uri
        this.playlistContent = new Array<Object>();
        this.currentlyPlaying;
        this.songWithMostVotes;
        this.stateKey = "spotify_auth_state";
        this.eventEmitter = eventEmitter;
        this.timer = null;
    }

    getAccessToken() {
        return this.access_token;
    }

    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    generateRandomString(length: number) {
        try {
            var text = "";
            var possible =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < length; i++) {
                text += possible.charAt(
                    Math.floor(Math.random() * possible.length)
                );
            }
            return text;
        } catch (error) {
            console.error(error);
        }
    };

    login(state: string) {
        try {
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
        } catch (error) {
            console.error(error);
        }
    };

    async callback(code: any) {
        try {
            // your application requests refresh and access tokens
            // after checking the state parameter
            const url = process.env.SPOTIFY_TOKEN_URL;
            var authOptions = {
                url,
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

                // we can also pass the token to the browser to make requests from there
                var redirectUrl = new URLSearchParams({
                    access_token: this.access_token,
                    refresh_token: this.refresh_token,
                });
            } else {
                var redirectUrl = new URLSearchParams({ error: "invalid_token" });
            }
            return redirectUrl;
        } catch (error) {
            console.error(error);
        }
    };

    async refreshToken() {
        try {
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
            }
        } catch (error) {
            console.error(error);
        }
    };

    async fetchPlaylist(id: string) {
        try {
            this.playlistContent = new Array<Object>();
            var _this = this;
            var hasNext = true;
            var url =
                "https://api.spotify.com/v1/playlists/" +
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

                if (!Array.isArray(response.data.items)) throw new Error("No data fetched!");
                for (const item of response.data.items) {
                    if (!item.track) continue;
                    const artists = Array<string>();
                    item.track.artists.forEach((artist: any) =>
                        artists.push(artist.name)
                    );

                    _this.playlistContent.push({
                        track: item.track.name,
                        id: item.track.id,
                        artist: artists,
                        album: item.track.album.name,
                        duration: _this.calculateDuration(item.track.duration_ms),
                        images: item.track.album.images,
                        votes: 0
                    });
                }
            }
            this.songWithMostVotes = _this.playlistContent[0];
            return _this.playlistContent;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    calculateDuration(duration: number) {
        return (
            Math.trunc(duration / 60000) +
            ":" +
            Math.round((duration / 60000 - Math.trunc(duration / 60000)) * 60)
                .toString(10)
                .padStart(2, "0")
        );
    };

    async getPlayer() {
        try {
            this.currentlyPlaying = new Object();
            var _this = this;
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

                _this.currentlyPlaying = {
                    track: response.data.item.name,
                    track_id: response.data.item.id,
                    device: response.data.device.name,
                    device_id: response.data.device.id,
                    artists: artists,
                    album: response.data.item.album.name,
                    duration: _this.calculateDuration(response.data.item.duration_ms),
                    progress: _this.calculateDuration(response.data.progress_ms),
                    isPlaying: response.data.is_playing,
                playlist_id: response.data.context.uri.split(":")[2],
                images: response.data.item.album.images
                };
                this.duration_ms = response.data.item.duration_ms;
                this.progress_ms = response.data.progress_ms;
                this.device_id = response.data.device.id;
                if (!this.lastSongAdded) {
                    this.lastSongAdded = {
                        track: this.currentlyPlaying.track,
                        id: this.currentlyPlaying.track_id,
                        artist: this.currentlyPlaying.artists,
                        album: this.currentlyPlaying.album,
                        duration: this.currentlyPlaying.duration,
                        votes: 0
                    }
                }
                this.startVoting();
                this.eventEmitter.emit("update_current_song", this.currentlyPlaying);
                return this.currentlyPlaying;
            }
            else {
                throw new Error("no active device, please visit the Spotify Web Player and start playing a playlist");
            }
        } catch (error) {
            console.error(error);
        }
    };

    async pausePlayer() {
        try {
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

        } catch (error) {
            console.error(error);
        }
    };

    async playPlayer() {
        try {
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
        } catch (error) {
            console.error(error);
        }
    };

    async transferPlayback(id: string) {
        try {
            this.device_id = id;
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
                play: false
            }

            const response = await axios.put(url, body, options);

            return {
                message: "playback switched"
            };
        } catch (error) {
            console.error(error);
        }
    }

    async addTracktoQueue(id: string) {
        try {
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
        } catch (error) {
            console.error(error);
        }
    };

    async getDevices() {
        try {
            var url = "https://api.spotify.com/v1/me/player/devices";
            var options = {
                url: url,
                headers: { Authorization: "Bearer " + this.access_token },
                json: true,
            };

            const response = await axios.get(url, options);
            //this.device_id = response.data.device.id;
            return response.data;
        } catch (error) {
            console.error(error);
        }
    };

    async upvote(track_id: string) {
        try {
            const track = this.playlistContent.find(item => item.id === track_id);
            track.votes++;

            this.songWithMostVotes = track;
            this.playlistContent.forEach(item => {
                if (item.votes > this.songWithMostVotes.votes) {
                    this.songWithMostVotes = item;
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    async getPlaylist() {
        try {
            if (!Array.isArray(this.playlistContent) || this.playlistContent.length === 0) throw new Error("Playlist empty - fetch first!");
            return this.playlistContent;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async startVoting() {
        try {
            if (this.duration_ms - this.progress_ms < 10000 && this.lastSongAdded.id === this.currentlyPlaying.track_id) {
                await this.addTracktoQueue(this.songWithMostVotes.id);
                this.lastSongAdded = this.songWithMostVotes;
                /*this.playlistContent.forEach(item => {
                    item.votes = 0;
                });*/
                const track = this.playlistContent.find(item => item.id === this.songWithMostVotes.id);
                this.playlistContent.splice(this.playlistContent.indexOf(track), 1);
                this.songWithMostVotes = this.playlistContent[0];
                this.playlistContent.forEach(item => {
                    if (item.votes > this.songWithMostVotes.votes) {
                        this.songWithMostVotes = item;
                    }
                });
                this.eventEmitter.emit("update_playlist", this.playlistContent)

                if (!this.timer) {
                    this.timer = setTimeout(() => {
                        this.getPlayer();
                        this.timer = null;
                    }, (this.duration_ms - this.progress_ms) + 500);
                }
            } else {
                if (!this.timer) {
                    this.timer = setTimeout(() => {
                        this.getPlayer();
                        this.timer = null;
                    }, parseInt(process.env.POLL_TIME));
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async resetLastSongAdded() {
        this.lastSongAdded = null;
    }
}

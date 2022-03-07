"use strict"
import express, { Application } from "express";
import bodyParser from "body-parser";
import http from "http";
import path from "path";
import 'dotenv/config';
import { Server } from 'socket.io';
import cookieParser from "cookie-parser";
import "spotify-playback-sdk-node"; 
import { Spotify } from "./app";
//import { SpotifyPlaybackSDK } from "spotify-playback-sdk-node/dist/spotify";


(async function () {
    try {

            //@TODO: Zugriff auf Spotify Nutzerdaten über process.env.SPOTIFY_USER || process.env.SPOTIFY_PW
        
        /**************************
        Web server Configuration
        **************************/
        const app = express();
        const server = http.createServer(app);


        // app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        //app.use(express.static(__dirname + '/public'));
        //app.use(cors());
        app.use(cookieParser());

        //Here we are configuring express to use body-parser as middle-ware.
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(bodyParser.json({
        }));

        /**************************
        REST-Api Hooks
        **************************/

        /**
        * initial hook
        * send startpage
        */
        app.get('/', async function (request, response) {
            try {
                return response.sendFile(path.resolve(__dirname + "/frontend/index.html"));
            } catch (e) {
                console.error(e);
            }
        });

        const spotifyAPI = new Spotify();

        app.get("/login", function (request, response) {
            var state = spotifyAPI.generateRandomString(16);
            response.cookie("spotify_auth_state", state);
            response.redirect(
                "https://accounts.spotify.com/authorize?" + spotifyAPI.login(state).toString()
            );
        });

        app.get("/callback", async function (request, response) {
            try {
                var code = request.query.code || null;
                var state = request.query.state || null;
                var storedState = request.cookies ? request.cookies["spotify_auth_state"] : null;

                if (state === null || state !== storedState) {
                    var responseUrl = new URLSearchParams({ error: "state_mismatch" });
                    response.redirect("/#" + responseUrl.toString());
                } else {
                    response.clearCookie("spotify_auth_state");
                    response.redirect("/#" + (await spotifyAPI.callback(code)).toString());
                }
            } catch (error) {
                console.error(error);
            }
        });

        app.get("/test", async function (request, response) {
            spotifyAPI.test();

        });

        app.get("/refresh_token", async function (request, response) {
            try {
                var refresh_token = request.query.refresh_token;
                response.send({
                    access_token: await spotifyAPI.refreshToken(refresh_token)
                });
            } catch (error) {
                console.error(error);
            }
        });

        app.get("/playlists/:playlist_id", async function (request, response) {
            try {
                response.json(await spotifyAPI.getPlaylist(request.params.playlist_id));
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message,
                });
            }
        });

        app.get("/users/:user_id/playlists", async function (request, response) {
            try {
                response.send(await spotifyAPI.getUserPlaylists(request.params.user_id));
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message,
                });
            }
        });

        app.get("/search/:track/:artist?", async function (request, response) {
            try {
                var track = request.params.track;
                var artist = request.params.artist;
                response.send(await spotifyAPI.searchTrack(track, artist));
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message,
                });
            }
        });

        app.get("/player", async function (request, response) {
            try {
                response.send(await spotifyAPI.getPlayer());
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message,
                });
            }
        });

        app.get("/player/pause", async function (request, response) {
            try {
                response.send(await spotifyAPI.pausePlayer());
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message,
                });
            }
        });

        app.get("/player/play", async function (request, response) {
            try {
                response.send(await spotifyAPI.playPlayer());
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });

        app.get("/switchPlayer/:device_id", async function (request, response) {
            try {
                var id = request.params.device_id;
                response.send(await spotifyAPI.transferPlayback(id));
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });

        /*app.get("/currentlyPlaying", async function (request, response) {
            try {
                response.send(await spotifyAPI.currentlyPlaying());
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });*/

        app.get("/player/queue/:track_id", async function (request, response) {
            try {
                var id = request.params.track_id;
                response.send(await spotifyAPI.addTracktoQueue(id));
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });

        app.get("/player/next", async function (request, response) {
            try {
                response.send(await spotifyAPI.nextTrack());
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });

        app.get("/player/previous", async function (request, response) {
            try {
                response.send(await spotifyAPI.previousTrack());
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });

        app.get("/player/repeat/:mode", async function (request, response) {
            try {
                var mode = request.params.mode;
                response.send(await spotifyAPI.setRepeatMode(mode));
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });

        app.get("/player/volume/:volume", async function (request, response) {
            try {
                var volume = request.params.volume;
                response.send(await spotifyAPI.setVolume(volume));
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message
                });
            }
        });

        app.get("/player/devices", async function (request, response) {
            try {
                response.send(await spotifyAPI.getDevices());
            } catch (error) {
                console.error(error);
                response.send({
                    message: error.message,
                });
            }
        });



        app.use(express.static(path.normalize(__dirname + "/frontend/")));
        const io = new Server(server);
        io.on("connection", (socket) => {
            console.log("Socket connected");
        });
        server.listen(process.env.SERVERPORT, async function () {
            try {
                console.log(`started && running @ port ${process.env.SERVERPORT}`);

            } catch (e) { console.error(e) }
        });
    } catch (e) {
        console.error(e);
    }
})()
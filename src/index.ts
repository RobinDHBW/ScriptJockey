"use strict"
import express, { Application } from "express";
import bodyParser from "body-parser";
import http from "http";
import path from "path";
import 'dotenv/config';
import { Server } from 'socket.io';
import cookieParser from "cookie-parser";
import { Spotify } from "./spotify/spotify-app";
import { GeniusApi } from './genius/genius-app';


(async function () {
    try {

        //@TODO: Zugriff auf Spotify Nutzerdaten über process.env.SPOTIFY_USER || process.env.SPOTIFY_PW

        /**************************
        Web server Configuration
        **************************/
        const app = express();
        const server = http.createServer(app);
        const gApiAccess = new GeniusApi();

        const swaggerUi = require('swagger-ui-express');
        const swaggerDocument = require('../src/openapi.json');
        app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        var timerId: any;

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

        app.get('/fe/start', async function (request, response) {
            try {
                return response.sendFile(path.resolve(__dirname + "/frontend/html/start.html"));
            } catch (e) {
                console.error(e);
            }
        });

        app.get('/fe/backroom-poker', async function (request, response) {
            try {
                return response.sendFile(path.resolve(__dirname + "/frontend/html/backroom.html"));
            } catch (e) {
                console.error(e);
            }
        });

        const spotifyAPI = new Spotify();
        //await spotifyAPI.createTab();

        app.get("/login", function (request, response) {
            var state = spotifyAPI.generateRandomString(16);
            response.cookie("spotify_auth_state", state);
            response.redirect(
                "https://accounts.spotify.com/authorize?" + spotifyAPI.login(state).toString()
            );
            clearInterval(timerId);
            timerId = setInterval(async () => await spotifyAPI.refreshToken(), 3360000);
            
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

        app.get("/playlists/:playlist_id", async function (request, response) {
            try {
                response.json(await spotifyAPI.getPlaylist(request.params.playlist_id));
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status).send({
                    status: error.response.data.error.status || error.response.status,
                    statusText: error.response.statusText,
                    message: error.response.data.error.message
                });
            }
        });

        app.get("/player", async function (request, response) {
            try {
                response.send(await spotifyAPI.getPlayer());
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status).send({
                    status: error.response.data.error.status || error.response.status,
                    statusText: error.response.statusText,
                    message: error.response.data.error.message
                });
            }
        });

        app.get("/player/pause", async function (request, response) {
            try {
                response.status(200).send(await spotifyAPI.pausePlayer());
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status).send({
                    status: error.response.data.error.status,
                    statusText: error.response.statusText,
                    message: error.response.data.error.message
                });
            }
        });

        app.get("/player/play", async function (request, response) {
            try {
                response.status(200).send(await spotifyAPI.playPlayer());
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status).send({
                    status: error.response.data.error.status,
                    statusText: error.response.statusText,
                    message: error.response.data.error.message
                });
            }
        });

        app.get("/switchPlayer/:device_id", async function (request, response) {
            try {
                var id = request.params.device_id;
                response.send(await spotifyAPI.transferPlayback(id));
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status).send({
                    status: error.response.data.error.status || error.response.status,
                    statusText: error.response.statusText,
                    message: error.response.data.error.message
                });
            }
        });

        app.post("/player/queue/:track_id", async function (request, response) {
            try {
                var id = request.params.track_id;
                response.send(await spotifyAPI.addTracktoQueue(id));
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status).send({
                    status: error.response.data.error.status || error.response.status,
                    statusText: error.response.statusText,
                    message: error.response.data.error.message
                });
            }
        });

        app.get("/player/devices", async function (request, response) {
            try {
                response.send(await spotifyAPI.getDevices());
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status).send({
                    status: error.response.data.error.status || error.response.status,
                    statusText: error.response.statusText,
                    message: error.response.data.error.message
                });
            }
        });


        app.get('/lyrics/:title/:artist', async function (req, res) {

            try {
                res.json(await gApiAccess.getLyrics(req));
            } catch (error) {
                console.error(error);
                res.json({
                    status: 404,
                    message: error.message,
                });
            }
        });


        app.use(express.static(path.join(__dirname + "/frontend/")));
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
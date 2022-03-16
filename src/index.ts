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
import { SwaggerOptions, SwaggerUiOptions } from "swagger-ui-express";


(async function () {
    try {

        //@TODO: Zugriff auf Spotify Nutzerdaten über process.env.SPOTIFY_USER || process.env.SPOTIFY_PW

        /**************************
        Web server Configuration
        **************************/
        const app = express();
        const server = http.createServer(app);
        const io = new Server(server);
        const gApiAccess = new GeniusApi();
        let spotifyAPI: Spotify;

        const swaggerUi: SwaggerOptions = require('swagger-ui-express');
        const swaggerDocument: JSON = require('../src/openapi.json');
        app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        let timerId: any;
        let djInTheHouse = false;
        let itsCallbackTime = false;

        //app.use(express.static(__dirname + '/public'));        
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
        app.get('/', async (request: express.Request, response: express.Response) => {
            try {
                return response.sendFile(path.resolve(__dirname + "/frontend/index.html"));
            } catch (e) {
                console.error(e);
                response.status(501);
                response.send(e.message);
            }
        });

        app.get('/fe/start', async (request: express.Request, response: express.Response) => {
            try {
                return response.sendFile(path.resolve(__dirname + "/frontend/html/start.html"));
            } catch (e) {
                console.error(e);
                response.status(501);
                response.send(e.message);
            }
        });

        app.get('/fe/backroom-poker', async (request: express.Request, response: express.Response) => {
            try {
                if (request.cookies && request.cookies["spotify_auth_state"] && djInTheHouse) {
                    return response.sendFile(path.resolve(__dirname + "/frontend/html/backroom.html"));
                } else if (!djInTheHouse) {
                    const state: string = spotifyAPI.generateRandomString(16);
                    response.status(250); //Own defined to check in Frontend
                    response.cookie("spotify_auth_state", state);
                    return response.send(process.env.SPOTIFY_AUTH_URL + spotifyAPI.login(state).toString())
                } else {
                    response.status(330); //Own set
                    response.send({ access: false });
                }
            } catch (e) {
                console.error(e);
                response.status(501);
                response.send(e.message);
            }
        });

        app.get('/fe/sync', async (request: express.Request, response: express.Response) => {
            try {
                if (!djInTheHouse) throw new Error("Not authenticated yet!");
                const playList = await spotifyAPI.getPlaylist();
                if (Array.isArray(playList)) return response.send(playList);
                const currentTrack: any = await spotifyAPI.getPlayer();
                return response.send(await spotifyAPI.fetchPlaylist(currentTrack.playlist_id));
            } catch (e) {
                if (e.message === "Not authenticated yet!") {
                    response.status(550);
                } else {
                    console.error(e);
                }

                response.send(e.message);
            }
        });

        app.post('/fe/upvote', async (request: express.Request, response: express.Response) => {
            try {
                spotifyAPI.upvote(request.body.id);
                io.emit("update_playlist", await spotifyAPI.getPlaylist())
                //TODO socket push -> Update all playlists
                return response.send("done");
            } catch (error) {
                console.error(error);
                response.status(501);
                response.send(error.message);
            }
        })



        app.get("/login", function (request, response) {
            const state = spotifyAPI.generateRandomString(16);
            response.cookie("spotify_auth_state", state);
            response.redirect(process.env.SPOTIFY_AUTH_URL + spotifyAPI.login(state).toString());
        });

        app.get("/callback", async function (request, response) {
            try {
                var code = request.query.code || null;
                var state = request.query.state || null;
                var storedState = request.cookies && request.cookies["spotify_auth_state"];

                if (state === null || state !== storedState) { //not wokring without a cookie
                    throw new Error("State mismatch. Authentication failure!");
                    // var responseUrl = new URLSearchParams({ error: "state_mismatch" });
                    //  response.redirect("/#" + responseUrl.toString());
                } else {
                    djInTheHouse = true;
                    clearInterval(timerId);
                    timerId = setInterval(async () => await spotifyAPI.refreshToken(), 3360000);
                    // response.clearCookie("spotify_auth_state");
                    spotifyAPI.callback(code);
                    itsCallbackTime = true;
                    response.redirect("/#");
                }
            } catch (error) {
                console.error(error);
                response.status(501);
                response.send(error);
                io.emit("spotify_auth_finished_failure", error);
            }
        });

        app.get("/playlists/:playlist_id", async function (request, response) {
            try {
                response.json(await spotifyAPI.fetchPlaylist(request.params.playlist_id));
            } catch (error) {
                console.error(error);
                response.status(error.response.data.error.status)
                response.send({
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
                response.status(501);
                response.send(error.message);
                // response.status(error.response.data.error.status).send({
                //     status: error.response.data.error.status || error.response.status,
                //     statusText: error.response.statusText,
                //     message: error.response.data.error.message
                // });
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
                response.status(error.response.data.error.status)
                response.send({
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
                response.status(error.response.data.error.status)
                response.send({
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
                response.status(error.response.data.error.status)
                response.send({
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
                response.status(error.response.data.error.status)
                response.send({
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
                res.status(404).json({
                    message: error.message,
                });
            }
        });


        app.use(express.static(path.join(__dirname + "/frontend/")));
        io.on("connection", async (socket) => {
            // console.log("Socket connected");
            if (itsCallbackTime) {
                itsCallbackTime = false;
                await new Promise(resolve => setTimeout(resolve, 300)); //Brechstange - Unschön, aber funktioniert^^
                io.emit("spotify_auth_finished_successful");
            }
        });
        server.listen({ port: process.env.SERVERPORT, host: process.env.SERVERIP }, async function () {
            try {
                spotifyAPI = new Spotify(JSON.stringify(server.address()));
                console.log(`started && running @ port ${process.env.SERVERPORT}`);

            } catch (e) { console.error(e) }
        });
    } catch (e) {
        console.error(e);
    }
})()
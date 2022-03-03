"use strict"
import express, { Application } from "express";
import bodyParser from "body-parser";
import http from "http";
import path from "path";
import 'dotenv/config';
import { Server } from 'socket.io';

(
    async function () {
        try {

            /**************************
            Web server Configuration
            **************************/
            const app = express();
            const server = http.createServer(app);

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
            * initial webservice
            * send startpage
            */
            app.get('/', async function (request, response) {
                try {
                    return response.sendFile(path.resolve(__dirname + "/src/atmjdj-webview/index.html"));
                } catch (e) {
                    console.error(e);
                }
            });


            app.use(express.static(path.normalize(__dirname + "/frontend/")));
            const io = new Server(server);
            io.on("connection", (socket)=>{
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
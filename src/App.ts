import * as express from "express";
import * as bodyParser from "body-parser";
import * as morgan from "morgan";

import "./model/Player";
//import ConverterRoutes from "./routes/ConverterRoutes";
import { NextFunction } from "connect";
import { Player } from "./model/Player";
import { Clock } from "./Clock";
import { KaynClass } from "kayn";
import { readFile } from "fs-extra";
import { Champion } from "./model/Champion";

declare global {
    interface Error {
        /** Appended http status */
        status?: number;
    }
}

class App {

    public app: express.Application;
    public actions: Function[] = [];

    private players: Player[] = [];

    constructor() {
        this.app = express();
        this.config();
    }

    public async query(kayn: KaynClass) {
        let clock = new Clock();
        clock.delay = 900;

        let playerText = await readFile("players.json");
        let playerItems = JSON.parse(playerText.toString("UTF-8"));
        for (let playerName of playerItems) {
            let player = await Player.findByUsername(kayn, playerName);
            if (player) {
                console.log("Player loaded: " + player.name);
                this.players.push(player);
            } else {
                console.log("Could not load player: " + playerName);
            }
        }

        await Champion.populateStatic(kayn);


        if (this.players.length > 0) {
            while (true) {
                for (let player of this.players) {
                    let didSomething = await player.nextAction(kayn);
                    if (didSomething) {
                        await clock.waitFor();
                    }
                }
            }
        }
    }

    private config() {
        // support application/json type post data
        this.app.use(morgan("dev"));
        this.app.use(bodyParser.json({ limit: "100mb" }));
        //support application/x-www-form-urlencoded post data
        this.app.use(bodyParser.urlencoded({ extended: false, limit: "100mb" }));

        //this.app.use("/csl", CslRoutes);
        this.app.use((req, res, next) => {
            if (req.path.match(/^\/?$/)) {
                res.end();
            } else {
                let err = new Error('Not Found');
                err.status = 404;
                next(err);
            }
        });
        this.app.use((err: Error,
            _req: express.Request,
            res: express.Response,
            _next: NextFunction) => {
            console.log(err);
            res.status(err.status || 500);
            res.json({ error: { message: err.message } });
        });
    }
}

export default new App();
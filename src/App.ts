import * as express from "express";
import * as bodyParser from "body-parser";
import * as morgan from "morgan";

import { NextFunction } from "connect";
import { Player } from "./model/Player";
import { KaynClass, Kayn, REGIONS } from "kayn";
import { readFile } from "fs-extra";
import { Champion } from "./model/Champion";
import { Match } from "./model/Match";

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
    private lastKey: string = "";

    constructor() {
        this.app = express();
        this.config();
    }

    public async query() {
        let kayn = this.loadKayn();
        await this.loadPlayers(kayn);
        await Champion.populateStatic(kayn);


        while (true) {
            for (let player of this.players) {
                try {
                    await player.nextAction(kayn);
                } catch (err) {
                    console.log(err);
                }
            }
            let unfinishedMatches = await Match.find({ where: { gameType: "MATCHED_GAME", winningTeamId: 0 }});
            for (let match of unfinishedMatches) {
                await match.identifyResult(kayn);
            }

            await this.loadPlayers(kayn);

            require("dotenv").config();
            if (this.lastKey != process.env.RIOT_LOL_API_KEY) {
                kayn = this.loadKayn();
            }
        }
    }

    private async loadPlayers(kayn: KaynClass) {
        let playerItems: any;
        try {
            let playerText = await readFile("players.json");
            playerItems = JSON.parse(playerText.toString("UTF-8"));
        } catch {
            console.log("Could not load players.json file");
            return;
        }
        
        this.players = [];
        for (let playerItem of playerItems) {
            let player = await Player.findByUsername(kayn, playerItem.name, playerItem.team);
            if (player) {
                this.players.push(player);
            } else {
                console.log("Could not load player: " + playerItem.name);
            }
        }
    }

    private loadKayn() {
        this.lastKey = <string>process.env.RIOT_LOL_API_KEY;
        return Kayn(this.lastKey)({
            region: REGIONS.EUROPE_WEST,
            debugOptions: {
                isEnabled: true,
                showKey: false,
            },
            requestOptions: {
                shouldRetry: true,
                numberOfRetriesBeforeAbort: 3,
                delayBeforeRetry: 1000,
                burst: false,
                shouldExitOn403: false,
            },
            cacheOptions: {
                cache: null,
                timeToLives: {
                    useDefault: false,
                    byGroup: {},
                    byMethod: {},
                },
            },
        })
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
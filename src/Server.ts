import app from "./App";
import "reflect-metadata";
import {createConnection} from "typeorm";
import { Player } from "./model/Player";
import { Kayn, REGIONS } from "kayn";
import { Champion } from "./model/Champion";
import { MatchReference } from "./model/MatchReference";
import { Match } from "./model/Match";

require('dotenv').config()

const PORT = 4040;
const HOST = "0.0.0.0";

const kayn = Kayn(process.env.RIOT_LOL_API_KEY)({
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

createConnection({
    type: "sqlite",
    database: "tracker.db",
    entities: [
        Player,
        Champion,
        Match,
        MatchReference
    ],
    synchronize: true,
    logging: false
}).then(_connection => {
    app.app.listen(PORT, HOST, () => {
        console.log('Express server listening on ' + HOST + ":" + PORT);
    });
    app.query(kayn);
}).catch(error => console.log(error));


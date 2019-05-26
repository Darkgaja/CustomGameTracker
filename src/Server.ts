import app from "./App";
import "reflect-metadata";
import {createConnection} from "typeorm";
import { Player } from "./model/Player";
import { Champion } from "./model/Champion";
import { MatchReference } from "./model/MatchReference";
import { Match } from "./model/Match";

require('dotenv').config()

const PORT = 4040;
const HOST = "0.0.0.0";

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
    app.query();
}).catch(error => console.log(error));


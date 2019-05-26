import { Entity, PrimaryColumn, Column, BaseEntity } from "typeorm";
import { SpectatorV4CurrentGameParticipant } from "kayn/typings/dtos";
import { Champion } from "./Champion";

@Entity()
export class MatchReference extends BaseEntity {

    @PrimaryColumn()
    gameId: number = 0;

    @PrimaryColumn()
    summonerId: string = "";

    @Column()
    summonerName: string = "";

    @Column()
    teamId: number = 100;
    
    @Column()
    champion: number = 0;

    @Column()
    championName: string = "";

    public static async fromParticipant(participant: SpectatorV4CurrentGameParticipant, gameId: number): Promise<MatchReference> {
        let ref = new MatchReference();
        ref.gameId = gameId;
        ref.teamId = <number>participant.teamId;
        ref.summonerId = <string>participant.summonerId;
        ref.summonerName = <string>participant.summonerName;
        ref.champion = <number>participant.championId;
        let champ = await Champion.findOne({ where: { key: ref.champion }});
        if (champ) {
            ref.championName = champ.name;
        }
        return ref;
    }
}
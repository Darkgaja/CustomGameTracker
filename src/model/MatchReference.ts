import { Entity, PrimaryColumn, Column, ManyToMany, ManyToOne, JoinTable, JoinColumn, BaseEntity } from "typeorm";
import { KaynClass } from "kayn";
import { MatchV4MatchReferenceDto, SpectatorV4CurrentGameInfo } from "kayn/typings/dtos";
import { Match } from "./Match";

@Entity()
export class MatchReference extends BaseEntity {

    @PrimaryColumn()
    gameId: number = 0;

    @PrimaryColumn()
    summonerId: string = "";

    @Column()
    champion: number = 0;

    @Column()
    gameType: string = "";

    isNew: boolean = false;

    public static async findByAccountId(kayn: KaynClass, summonerId: string): Promise<MatchReference | undefined> {
        let ddragon: SpectatorV4CurrentGameInfo;
        try {
            ddragon = await kayn.CurrentGame.by.summonerID(summonerId);
        } catch {
            return undefined;
        }
        
        if (ddragon) {
            let match = await this.findOne({ where: { gameId: ddragon.gameId, summonerId: summonerId } });
            if (!match) {
                match = new MatchReference();
                match.isNew = true;
                match.copy(ddragon, summonerId);
                await match.save();
            }
            return match;
        }
        return undefined;
    }

    public copy(matchReference: SpectatorV4CurrentGameInfo, summonerId: string) {
        this.gameId = <number>matchReference.gameId;
        this.gameType = <string>matchReference.gameType;
        this.summonerId = summonerId;
        if (matchReference.participants) {
            for (let participant of matchReference.participants) {
                if (participant.summonerId == summonerId) {
                    this.champion = <number>participant.championId;
                }
            }
        }
    }

    public async getMatch(kayn: KaynClass): Promise<Match | undefined> {
        return await Match.findByMatchId(kayn, this.gameId);
    }
}
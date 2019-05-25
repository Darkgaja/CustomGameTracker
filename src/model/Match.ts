import { Entity, PrimaryColumn, Column, ManyToMany, ManyToOne, JoinTable, JoinColumn, BaseEntity } from "typeorm";
import { KaynClass } from "kayn";
import { MatchV4MatchDto } from "kayn/typings/dtos";

@Entity()
export class Match extends BaseEntity {

    @PrimaryColumn()
    gameId: number = 0;

    @Column()
    gameType: string = "";

    

    public static async findByMatchId(kayn: KaynClass, matchId: number) : Promise<Match | undefined> {
        let ddragon = await kayn.Match.get(matchId);
        if (ddragon) {
            let match = new Match();
            match.copy(ddragon);
            await match.save();
            return match;
        }
        return undefined;
    }

    public copy(match: MatchV4MatchDto) {
        this.gameId = <number>match.gameId;
        this.gameType = <string>match.gameType;
    }
}
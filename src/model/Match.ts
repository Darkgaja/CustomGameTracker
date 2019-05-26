import { Entity, PrimaryColumn, Column, BaseEntity, OneToMany } from "typeorm";
import { KaynClass } from "kayn";
import { SpectatorV4CurrentGameInfo } from "kayn/typings/dtos";
import { MatchReference } from "./MatchReference";

@Entity()
export class Match extends BaseEntity {

    @PrimaryColumn()
    gameId: number = 0;

    @OneToMany(() => MatchReference, ref => ref.summonerId, { cascade: true})
    participants: MatchReference[] | undefined;

    @Column()
    winningTeamId: number = 0;

    @Column()
    gameType: string = "";

    isNew: boolean = false;

    public findChampion(summonerId: string) {
        if (this.participants) {
            for (let member of this.participants) {
                if (member.summonerId == summonerId) {
                    return member.championName;
                }
            }
        }
        return undefined;
    }

    public static async findByAccountId(kayn: KaynClass, summonerId: string): Promise<Match | undefined> {
        let ddragon: SpectatorV4CurrentGameInfo;
        try {
            ddragon = await kayn.CurrentGame.by.summonerID(summonerId);
        } catch {
            return undefined;
        }
        let match = await this.findOne({ where: { gameId: ddragon.gameId } });
        if (!match) {
            match = new Match();
            match.isNew = true;
            await match.copy(ddragon);
            await match.save();
        }
        return match;
    }

    public async copy(matchReference: SpectatorV4CurrentGameInfo) {
        this.gameId = <number>matchReference.gameId;
        this.gameType = <string>matchReference.gameType;
        if (matchReference.participants) {
            this.participants = [];
            for (let participant of matchReference.participants) {
                if (participant) {
                    let teamMember = await MatchReference.fromParticipant(participant, this.gameId);
                    if (teamMember) {
                        this.participants.push(teamMember);
                    }
                }
            }
        }
    }

    public async identifyResult(kayn: KaynClass) {
        try {
            let endedMatch = await kayn.Match.get(this.gameId);
            if (endedMatch.teams) {
                for (let team of endedMatch.teams) {
                    if (team && team.win == "Win") {
                        this.winningTeamId = <number>team.teamId;
                        await this.save();
                        break;
                    }
                }
            }
        } catch {

        }
    }
}
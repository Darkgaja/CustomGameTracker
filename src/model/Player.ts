import { Entity, PrimaryColumn, Column, ManyToMany, ManyToOne, JoinTable, JoinColumn, BaseEntity } from "typeorm";
import { KaynClass } from "kayn";
import { SummonerV4SummonerDTO } from "kayn/typings/dtos";
import { MatchReference } from "./MatchReference";
import { Champion } from "./Champion";

@Entity()
export class Player extends BaseEntity {

    @PrimaryColumn()
    id: string = "";

    @Column()
    name: string = "";

    @Column()
    profileIconId: number = 0;

    @Column()
    puuid: string = "";

    @Column()
    summonerLevel: number = 0;

    @Column()
    revisionDate: string = "0";

    @Column()
    accountId: string = "";

    @Column()
    team: string = "";

    public static async findByUsername(kayn: KaynClass, name: string): Promise<Player | undefined> {
        let dbPlayer = await this.findOne({ where: { name: name } });

        if (dbPlayer) {
            return dbPlayer;
        } else {
            let kaynPlayer: SummonerV4SummonerDTO;
            try {
                kaynPlayer = await kayn.Summoner.by.name(name)
            } catch {
                return undefined;
            }

            if (kaynPlayer.id) {
                let player = new Player();
                player.copy(kaynPlayer);
                await player.save();
                return player;
            } else {
                return undefined;
            }
        }
    }

    public copy(kaynPlayer: SummonerV4SummonerDTO) {
        this.id = <string>kaynPlayer.id;
        this.name = <string>kaynPlayer.name;
        this.profileIconId = <number>kaynPlayer.profileIconId;
        this.puuid = <string>kaynPlayer.puuid;
        this.summonerLevel = <number>kaynPlayer.summonerLevel;
        if (kaynPlayer.revisionDate) {
            this.revisionDate = kaynPlayer.revisionDate.toString();
        }
        this.accountId = <string>kaynPlayer.accountId;
    }

    public async nextAction(kayn: KaynClass): Promise<boolean> {
        let matchRef = await MatchReference.findByAccountId(kayn, this.id);
        let result = false;
        if (matchRef && matchRef.isNew) {
            let champ = await Champion.findById(matchRef.champion);
            if (matchRef.gameType == "CUSTOM_GAME" && champ) {
                console.log(`User '${this.name}' playing ${champ.name} in custom game ${matchRef.gameId}`);
            }
            result = true;
        }
        return result;
    }
}
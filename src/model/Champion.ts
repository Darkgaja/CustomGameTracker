import { BaseEntity, Entity, PrimaryColumn, Column } from "typeorm";
import { KaynClass } from "kayn";

@Entity()
export class Champion extends BaseEntity {

    @PrimaryColumn()
    key: number = 0;

    @Column()
    name: string = "";

    public static async findById(id: number) {
        return await this.findOne({ where: {key: id } })
    }

    public static copy(ddragonChampion: any): Champion {
        let champ = new Champion();
        champ.key = ddragonChampion.key;
        champ.name = ddragonChampion.name;
        return champ;
    }

    public static async populateStatic(kayn: KaynClass): Promise<void> {
        await Champion.clear();
        let untyped = <any>kayn;
        let champions = await untyped.DDragon.Champion.list()
        let data = champions.data;
        for (let champ of Object.keys(data)) {
            let realChamp = Champion.copy(data[champ]);
            await realChamp.save();
        }
    }

}
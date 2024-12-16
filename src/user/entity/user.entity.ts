import { Exclude } from "class-transformer";
import { BaseTable } from "src/common/entity/base-table.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum Role {
    admin,
    paiduser,
    user
}

@Entity()
export class User extends BaseTable{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    @Exclude({
        toPlainOnly: true, // 응답할때 제외
    })
    password: string;

    @Column({
        enum: Role,
        default: Role.user
    })
    role: Role;
}

import { Role } from "@prisma/client"

// import { Schema, Types } from "mongoose"
// export const userSchema = new Schema({
//     id: Number,
//     email: String,
//     password: String,
//     role: Role,
//     createdMovies: [{
//         type: Types.ObjectId,
//         ref: 'Movie'
//     }],
//     likedMovies: [{
//         type: Types.ObjectId,
//         ref: 'MovieUserLike'
//     }],
//     chats: [{
//         type: Types.ObjectId,
//         ref: 'Chat'
//     }],
//     chatRooms: [{
//         type: Types.ObjectId,
//         ref: 'ChatRoom'
//     }],
// })
import { Document, Types } from "mongoose"
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Movie } from "src/movie/schema/movie.schema";
import { MovieUserLike } from "src/movie/schema/movie-user-like.schema";
import { Chat } from "src/chat/schema/chat.schema";
import { ChatRoom } from "src/chat/schema/chat-room.schema";

@Schema({
    timestamps: true,
})
export class User extends Document {
    @Prop({
        unique: true,
        required: true,
    })
    email: string;

    @Prop({
        required: true,
        select: false
    })
    password: string;

    @Prop({
        enum: Role,
        default: Role.user
    })
    role: Role;

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'Movie'    
        }],
    })
    createdMovies: Movie[]

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'MovieUserLike'    
        }],
    })
    likedMovies: MovieUserLike[]

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'Chat'    
        }],
    })
    chats: Chat[];

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'ChatRoom'    
        }],
    })
    chatRooms: ChatRoom[];
}

export const UserSchema = SchemaFactory.createForClass(User);
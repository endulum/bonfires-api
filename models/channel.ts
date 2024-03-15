import mongoose, { Schema, type Types, type Document } from 'mongoose'
import type { IUserDocument } from './user'

export interface IChannel {
  title: string
  admin: Types.ObjectId
  users: Types.ObjectId[]
}

export interface IChannelDocument extends IChannel, Document {
  removeFromChannel: (user: IUserDocument) => Promise<void>
  inviteToChannel: (user: IUserDocument) => Promise<void>
  promoteToAdmin: (user: IUserDocument) => Promise<void>
}

const ChannelSchema = new Schema<IChannelDocument>({
  title: { type: String, required: true }, // todo: add regex match property
  admin: { type: Schema.ObjectId, ref: 'User', required: true },
  users: [{ type: Schema.ObjectId, ref: 'User', required: true }]
})

// are these methods necessary? let's just try having them for now

ChannelSchema.methods.removeFromChannel = async function (user: IUserDocument) {
  this.users = this.users.filter((userId: Types.ObjectId) => {
    return userId.toString() !== user.id.toString()
  })
  await this.save()
}

ChannelSchema.methods.inviteToChannel = async function (user: IUserDocument) {
  this.users.push(user)
  await this.save()
}

ChannelSchema.methods.promoteToAdmin = async function (user: IUserDocument) {
  this.admin = user
  await this.save()
}

const Channel = mongoose.model<IChannelDocument>('Channel', ChannelSchema)
export default Channel

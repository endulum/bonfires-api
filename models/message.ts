import mongoose, { Schema, type Types, type Document } from 'mongoose'
import { type IUserDocument } from './user'

export interface IMessage {
  channel: Types.ObjectId
  user: Types.ObjectId | IUserDocument
  timestamp: Date
  isRemoved: boolean
  content: string
}

export interface IMessageDocument extends IMessage, Document {}

const MessageSchema = new Schema<IMessageDocument>({
  channel: { type: Schema.ObjectId, required: true },
  user: { type: Schema.ObjectId, required: true },
  timestamp: { type: Date, required: true, default: () => Date.now(), immutable: true },
  isRemoved: { type: Boolean, default: true, required: true },
  content: { type: String, required: true }
})

const Message = mongoose.model<IMessageDocument>('Message', MessageSchema)
export default Message

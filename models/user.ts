import mongoose, { Schema, Types, type Document, type Model, type CallbackError } from 'mongoose'
import bcrypt from 'bcryptjs'
import { type IChannelDocument } from './channel'

interface DisplayName { channel: Types.ObjectId, displayName: string }

interface IUser {
  username: string
  password: string
  displayNames: DisplayName[]
}

export interface IUserDocument extends IUser, Document {
  id: Types.ObjectId
  checkPassword: (password: string) => Promise<boolean>
  changeDisplayName: (channel: IChannelDocument, newName: string) => Promise<void>
  getDisplayName: (channel: IChannelDocument) => DisplayName | null
}

interface IUserModel extends Model<IUserDocument> {
  findByNameOrId: (nameOrId: string) => Promise<IUserDocument>
}

const UserSchema = new Schema<IUserDocument>({
  username: { type: String, required: true, match: /^[a-z0-9-]+$/g },
  password: { type: String, required: true },
  displayNames: [
    {
      channel: { type: Types.ObjectId, required: true },
      displayName: { type: String, required: true }
    }
  ]
})

UserSchema.methods.checkPassword = async function (password: string) {
  const result = await bcrypt.compare(password, (this.password as string))
  return result
}

UserSchema.methods.changeDisplayName = async function (
  channel: IChannelDocument,
  newName: string
) {
  if (newName === '') {
    this.displayNames = this.displayNames.filter(
      (name: DisplayName) => name.channel.toString() !== channel.id.toString()
    )
  } else {
    const existingChannelIndex: number = this.displayNames.findIndex(
      (name: DisplayName) => name.channel.toString() === channel.id.toString()
    )
    if (existingChannelIndex === -1) {
      this.displayNames.push({ channel: channel.id, displayName: newName })
    } else {
      this.displayNames[existingChannelIndex].displayName = newName
    }
  }
  await this.save()
}

UserSchema.methods.getDisplayName = function (channel: IChannelDocument) {
  const existingName: DisplayName = this.displayNames.find(
    (name: DisplayName) => name.channel.toString() === channel.id.toString()
  )
  if (existingName === undefined) return null
  return existingName.displayName
}

UserSchema.statics.findByNameOrId = function (nameOrId: string) {
  if (mongoose.isValidObjectId(nameOrId)) return this.findById(nameOrId)
  return this.findOne({ username: nameOrId })
}

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) { next(); return }
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: unknown) {
    next((error as CallbackError))
  }
})

const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema)
export default User

// https://stackoverflow.com/a/73087568

import mongoose, { Schema } from "mongoose";

import {
  UserDocument,
  ChannelDocument,
  ChannelModel,
  ChannelSchema,
} from "../interfaces/mongoose.gen";
import { Message } from "./message";

const channelSchema: ChannelSchema = new Schema({
  title: { type: String, required: true },
  admin: { type: Schema.ObjectId, ref: "User", required: true },
  users: [{ type: Schema.ObjectId, ref: "User", required: true }],
});

channelSchema.method("isInChannel", async function (user: UserDocument) {
  return (
    this.users.find((u) => u.id.toString() !== user.id.toString()) !== undefined
  );
});

channelSchema.method("isAdmin", async function (user: UserDocument) {
  return this.admin.id.toString() === user.id.toString();
});

channelSchema.method("updateTitle", async function (newTitle: string) {
  this.title = newTitle;
  await this.save();
});

channelSchema.method("updateAdmin", async function (user: UserDocument) {
  this.admin = user;
  await this.save();
});

channelSchema.method("kick", async function (user: UserDocument) {
  this.users.pull(user);
  await this.save();
});

channelSchema.method("invite", async function (user: UserDocument) {
  this.users.push(user);
  await this.save();
});

channelSchema.pre("findOneAndDelete", async function (next) {
  await Message.deleteMany({ channel: this });
  return next();
});

export const Channel: ChannelModel = mongoose.model<
  ChannelDocument,
  ChannelModel
>("Channel", channelSchema);

import mongoose, { Schema } from "mongoose";

import {
  UserDocument,
  ChannelDocument,
  ChannelModel,
  ChannelSchema,
} from "../interfaces/mongoose.gen";
// import { ChannelSettings } from "./channelSettings";
import { Message } from "./message";
import { UserSettings } from "./userSettings";

const channelSchema: ChannelSchema = new Schema({
  title: { type: String, required: true },
  admin: { type: Schema.ObjectId, ref: "User", required: true },
  users: [{ type: Schema.ObjectId, ref: "User", required: true }],
});

// this is to avoid 500's if the :channel param isn't an id
channelSchema.query.byId = function (id: string) {
  if (mongoose.isValidObjectId(id)) return this.where({ _id: id });
  return this.where({ _id: undefined });
};

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

channelSchema.method("kick", async function (users: UserDocument[]) {
  this.users.pull(...users);
  await this.save();
});

channelSchema.method("invite", async function (users: UserDocument[]) {
  this.users.push(...users);
  await this.save();
});

channelSchema.pre("findOneAndDelete", async function (next) {
  await Message.deleteMany({ channel: this });
  await UserSettings.deleteMany({ channel: this });
  return next();
});

export const Channel: ChannelModel = mongoose.model<
  ChannelDocument,
  ChannelModel
>("Channel", channelSchema);

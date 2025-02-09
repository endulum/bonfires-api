import mongoose, { Schema, Types } from "mongoose";

import {
  UserDocument,
  ChannelDocument,
  ChannelModel,
  ChannelSchema,
} from "../interfaces/mongoose.gen";
import { ChannelSettings } from "./channelSettings";
import { Message } from "./message";

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

channelSchema.query.withUsersAndSettings = function (id: Types.ObjectId) {
  return this.populate({
    path: "users",
    select: ["username"],
    populate: [
      {
        path: "channelSettings",
        model: "ChannelSettings",
        match: { channel: id },
        select: ["displayName", "nameColor", "-_id", "-user"],
      },
      {
        path: "settings",
        select: ["defaultNameColor", "-_id"],
      },
    ],
  });
};

channelSchema.method("isInChannel", function (user: UserDocument) {
  return (
    this.users.find((u) => u._id.toString() === user._id.toString()) !==
    undefined
  );
});

channelSchema.method("getSettings", async function (user: UserDocument) {
  let channelSettings = await ChannelSettings.findOne({
    user,
    channel: this,
  });
  if (!channelSettings)
    channelSettings = await ChannelSettings.create({
      user: user,
      channel: this,
    });
  return channelSettings;
});

channelSchema.method("isAdmin", function (user: UserDocument) {
  return this.admin._id.toString() === user._id.toString();
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
  await ChannelSettings.deleteMany({
    $and: [{ channel: this }, { user: { $in: users } }],
  });
});

channelSchema.method("invite", async function (users: UserDocument[]) {
  this.users.push(...users);
  await this.save();
  await ChannelSettings.insertMany(
    users.map((u) => ({ user: u, channel: this }))
  );
});

channelSchema.pre("save", async function (next) {
  if (this.isNew) {
    // make sure the admin is included in the users array and gets own settings
    this.users.push(this.admin);
    await ChannelSettings.create({
      user: this.admin,
      channel: this,
    });
  }
  return next();
});

// remove associated messages and ChannelSettings documents
channelSchema.pre("deleteOne", async function (next) {
  // deleteOne is a query hook, not a document hook,
  // and i can't change this to a "findOneAndDelete" hook
  // because not only is that also still a query hook,
  // it will simply not run if `document` is set to true.
  // this is a workaround to still get the id from `this`
  if ("_conditions" in this) {
    const id = (this["_conditions"] as { _id: mongoose.Types.ObjectId })["_id"];
    await Message.deleteMany({ channel: id });
    await ChannelSettings.deleteMany({ channel: id });
  }
  return next();
});

export const Channel: ChannelModel = mongoose.model<
  ChannelDocument,
  ChannelModel
>("Channel", channelSchema);

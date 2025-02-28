import mongoose, { Schema, Types } from "mongoose";

import {
  MessageDocument,
  MessageModel,
  MessageSchema,
  ChannelDocument,
  UserDocument,
} from "../interfaces/mongoose.gen";
import { Channel } from "./channel";
import { Event } from "./event";

const messageSchema: MessageSchema = new Schema({
  channel: { type: Schema.ObjectId, ref: "Channel", required: true },
  user: { type: Schema.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: () => Date.now(), immutable: true },
  lastEdited: { type: Date },
  content: { type: String, required: true },
  pinned: { type: Boolean, default: false },
});

messageSchema.static(
  "getPaginatedForChannel",
  async function (
    channel: ChannelDocument,
    take: number = 30,
    before?: string
  ) {
    const messages = await Message.find({
      channel,
      ...(before && {
        timestamp: {
          $lte: before,
        },
      }),
    })
      .limit(take + 1)
      .sort("-timestamp -_id")
      .populate("user", "_id username")
      .select("-channel");

    return {
      messages: messages.slice(0, take),
      nextMessageTimestamp:
        messages.length > take
          ? messages[messages.length - 1].timestamp?.getTime()
          : null,
    };
  }
);

messageSchema.static(
  "getPinnedForChannel",
  async function (channel: ChannelDocument) {
    const pinnedMessages = await Message.find({
      channel,
      pinned: true,
    })
      .sort("-timestamp -_id")
      .populate("user", "_id username")
      .select("-channel");

    return pinnedMessages;
  }
);

messageSchema.query.byId = function (id: string) {
  if (mongoose.isValidObjectId(id)) return this.where({ _id: id });
  return this.where({ _id: undefined });
};

messageSchema.query.byIdFull = function (id: string) {
  if (mongoose.isValidObjectId(id))
    return this.where({ _id: id })
      .populate("user", "_id username")
      .select("-channel");
  return this.where({ _id: undefined });
};

messageSchema.method("belongsTo", async function (userId: Types.ObjectId) {
  return userId.toString() === this._id.toString();
});

messageSchema.method("edit", async function (content: string) {
  this.content = content;
  this.lastEdited = new Date();
  await this.save();
});

messageSchema.method(
  "pin",
  async function (pinned: boolean, user: UserDocument) {
    this.pinned = pinned;
    await this.save();

    if (pinned === true) {
      const { _id } = await Event.create({
        type: "message_pin",
        channel: this.channel,
        user,
        targetMessage: this,
      });
      const event = await Event.findOne().byIdFull(_id);
      return event;
    } else return null;
  }
);

messageSchema.post("save", async function (doc, next) {
  await Channel.updateOne(
    { _id: doc.channel.toString() },
    { lastActivity: doc.timestamp }
  );
  return next();
});

export const Message = mongoose.model<MessageDocument, MessageModel>(
  "Message",
  messageSchema
);

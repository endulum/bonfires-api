import mongoose, { Schema } from "mongoose";

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
  channel: { type: Schema.ObjectId, ref: "User", required: true },
  user: { type: Schema.ObjectId, ref: "Channel", required: true },
  timestamp: { type: Date, default: () => Date.now(), immutable: true },
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
      .select("-channel");

    return pinnedMessages;
  }
);

// this is to avoid 500's if the :message param isn't an id
messageSchema.query.byId = function (id: string) {
  if (mongoose.isValidObjectId(id)) return this.where({ _id: id });
  return this.where({ _id: undefined });
};

messageSchema.method(
  "pin",
  async function (pinned: boolean, user: UserDocument) {
    this.pinned = pinned;
    await this.save();

    if (pinned === true)
      await Event.create({
        type: "message_pin",
        channel: this.channel,
        user,
        targetMessage: this,
      });
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

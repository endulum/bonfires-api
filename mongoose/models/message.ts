import mongoose, { Schema } from "mongoose";

import {
  MessageDocument,
  MessageModel,
  MessageSchema,
  ChannelDocument,
} from "../interfaces/mongoose.gen";
import { Channel } from "./channel";

const messageSchema: MessageSchema = new Schema({
  channel: { type: Schema.ObjectId, ref: "User", required: true },
  user: { type: Schema.ObjectId, ref: "Channel", required: true },
  timestamp: { type: Date, default: () => Date.now(), immutable: true },
  content: { type: String, required: true },
});

messageSchema.static(
  "getPaginated",
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

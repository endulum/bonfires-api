import mongoose, { Schema } from "mongoose";

import {
  MessageDocument,
  MessageModel,
  MessageSchema,
} from "../interfaces/mongoose.gen";

const messageSchema: MessageSchema = new Schema({
  channel: { type: Schema.ObjectId, ref: "User", required: true },
  user: { type: Schema.ObjectId, ref: "Channel", required: true },
  timestamp: { type: Date, default: () => Date.now(), immutable: true },
  content: { type: String, required: true },
});

export const Message = mongoose.model<MessageDocument, MessageModel>(
  "Message",
  messageSchema
);

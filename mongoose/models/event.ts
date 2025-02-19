import mongoose, { Schema, Types } from "mongoose";

import {
  EventDocument,
  EventModel,
  EventSchema,
} from "../interfaces/mongoose.gen";
import { ChannelDocument } from "../interfaces/mongoose.gen";

const eventSchema: EventSchema = new Schema({
  type: {
    required: "true",
    type: String,
    enum: [
      "user_invite", // user-1 added user-2 to this camp. -
      "user_leave", // user-1 left this camp. -
      "user_kick", // user-1 removed user-2 from this camp. -
      "message_pin", // user-1 pinned a message to this camp. -
      "channel_avatar", // user-1 changed the camp avatar. -
      "channel_title", // user-1 changed the camp name: 'new name' -
    ],
  },
  channel: { type: Types.ObjectId },
  user: { type: Types.ObjectId },
  timestamp: { type: Date, default: () => Date.now(), immutable: true },
  targetUser: { type: Types.ObjectId, required: false },
  targetMessage: { type: Types.ObjectId, required: false },
  newChannelTitle: { type: String, required: false },
});

// get all events between two timestamps
// (or after the first timestamp if the second is not defined)
eventSchema.static(
  "getForChannel",
  async function (
    channel: ChannelDocument,
    beginTimestamp: Date,
    endTimestamp?: Date
  ) {
    const events = await Event.find({
      channel,
      timestamp: {
        $lte: beginTimestamp,
        ...(endTimestamp && { $gte: endTimestamp }),
      },
    })
      .sort("-timestamp -_id")
      .select("-channel");
    return events;
  }
);

export const Event: EventModel = mongoose.model<EventDocument, EventModel>(
  "Event",
  eventSchema
);

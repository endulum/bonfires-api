import mongoose, { Schema } from "mongoose";

import {
  ChannelSettingsDocument,
  ChannelSettingsModel,
  ChannelSettingsSchema,
} from "../interfaces/mongoose.gen";

const channelSettingsSchema: ChannelSettingsSchema = new Schema({
  // the refs
  user: { type: Schema.ObjectId, required: true },
  channel: { type: Schema.ObjectId, required: true },

  // the settings
  displayName: { type: String },
  nameColor: { type: String, match: /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i },
  invisible: { type: Boolean },
});

channelSettingsSchema.method(
  "update",
  async function (body: Record<string, string>) {
    this.displayName = body.displayName !== "" ? body.displayName : undefined;
    this.nameColor = body.nameColor !== "" ? body.nameColor : undefined;
    this.invisible =
      body.invisible === "true"
        ? true
        : body.invisible === "false"
        ? false
        : undefined;
    await this.save();
  }
);

export const ChannelSettings = mongoose.model<
  ChannelSettingsDocument,
  ChannelSettingsModel
>("ChannelSettings", channelSettingsSchema);

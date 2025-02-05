import mongoose, { Schema } from "mongoose";

import {
  ChannelSettingsDocument,
  ChannelSettingsModel,
  ChannelSettingsSchema,
} from "../interfaces/mongoose.gen";

const channelSettingsSchema: ChannelSettingsSchema = new Schema({
  user: { type: Schema.ObjectId, required: true },
  channel: { type: Schema.ObjectId, required: true },
  displayName: { type: String },
  nameColor: { type: String, match: /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i },
  invisible: { type: Boolean },
});

channelSettingsSchema.methods.changeDisplayName = async function (
  newDisplayName: string | undefined
) {
  this.displayName = newDisplayName;
  await this.save();
};

channelSettingsSchema.methods.changeNameColor = async function (
  newNameColor: string | undefined
) {
  this.nameColor = newNameColor;
  await this.save();
};

channelSettingsSchema.methods.toggleInvisible = async function (
  value?: boolean
) {
  this.invisible = value !== undefined ? value : !this.invisible;
  await this.save();
};

export const ChannelSettings = mongoose.model<
  ChannelSettingsDocument,
  ChannelSettingsModel
>("ChannelSettings", channelSettingsSchema);

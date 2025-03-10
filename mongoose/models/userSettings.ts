import mongoose, { Schema, Types } from "mongoose";

import {
  UserSettingsDocument,
  UserSettingsModel,
  UserSettingsSchema,
} from "../interfaces/mongoose.gen";

const userSettingsSchema: UserSettingsSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  defaultNameColor: {
    type: String,
    match: /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i,
  },
  defaultInvisible: { type: Boolean, required: true, default: false },
});

export const UserSettings = mongoose.model<
  UserSettingsDocument,
  UserSettingsModel
>("UserSettings", userSettingsSchema);

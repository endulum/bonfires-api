import mongoose, { Schema } from "mongoose";

import {
  UserSettingsDocument,
  UserSettingsModel,
  UserSettingsSchema,
} from "../interfaces/mongoose.gen";

const userSettingsSchema: UserSettingsSchema = new Schema({
  defaultNameColor: {
    type: String,
    required: true,
    match: /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i,
    default: "#ffffff",
  },
  defaultInvisible: { type: Boolean, required: true, default: false },
});

export const UserSettings = mongoose.model<
  UserSettingsDocument,
  UserSettingsModel
>("UserSettings", userSettingsSchema);

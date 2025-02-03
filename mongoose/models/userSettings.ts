import mongoose, { Schema } from "mongoose";

import {
  UserSettingsDocument,
  UserSettingsModel,
  UserSettingsSchema,
} from "../interfaces/mongoose.gen";

const userSettingsSchema: UserSettingsSchema = new Schema({
  user: { type: Schema.ObjectId, required: true },
  defaultNameColor: { type: String, match: /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i },
  defaultInvisible: { type: Boolean, required: true, default: false },
});

userSettingsSchema.methods.changeNameColor = async function (
  newNameColor: string | undefined
) {
  this.defaultNameColor = newNameColor;
  await this.save();
};

userSettingsSchema.methods.toggleInvisible = async function (value?: boolean) {
  this.defaultInvisible = value !== undefined ? value : !this.defaultInvisible;
  await this.save();
};

export const UserSettings = mongoose.model<
  UserSettingsDocument,
  UserSettingsModel
>("UserSettings", userSettingsSchema);

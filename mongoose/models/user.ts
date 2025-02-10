import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

import {
  UserDocument,
  UserModel,
  UserSchema,
  UserQuery,
} from "../interfaces/mongoose.gen";

import { UserSettings } from "./userSettings";
import { Channel } from "./channel";

const userSchema: UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-z0-9-]+$/g,
    },
    password: { type: String, select: false },
    joined: { type: Date, default: () => Date.now(), immutable: true },
    status: { type: String },
    ghUser: { type: String, required: false },
    ghId: { type: Number, required: false },
    settings: {
      type: Types.ObjectId,
      ref: "UserSettings",
      required: true,
      default: () => new mongoose.Types.ObjectId(),
    },
    hasAvatar: { type: Boolean, required: true, default: false },
  },
  { id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual("channelSettings", {
  ref: "ChannelSettings",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

userSchema.query.byNameOrId = function (nameOrId: string): UserQuery {
  if (mongoose.isValidObjectId(nameOrId)) return this.where({ _id: nameOrId });
  return this.where({ username: nameOrId });
};

userSchema.method("getMutualChannels", async function (user: UserDocument) {
  const channels = await Channel.find({
    users: {
      $all: [this._id, user._id],
    },
  }).select(["id", "title"]);
  return channels;
});

userSchema.method(
  "updateDetails",
  async function (body: Record<string, string>) {
    // this User object's details
    if (body.username !== "") this.username = body.username;
    this.status = body.status;
    if (body.password !== "") this.password = body.password;

    // the UserSettings object belonging to this User object
    const settings = await UserSettings.findOne({ user: this });
    if (settings) {
      settings.defaultInvisible = body.defaultInvisible === "true";
      settings.defaultNameColor = body.defaultNameColor;
      await settings.save();
    }
    await this.save();
  }
);

userSchema.method("updateGitHubUser", async function (ghUser: string) {
  this.ghUser = ghUser;
  await this.save();
});

userSchema.method("comparePassword", async function (password: string) {
  const user: UserDocument & { password?: string } = await this.model("User")
    .findById(this._id)
    .select("+password");
  if (!user || !user.password) return false;
  return bcrypt.compare(password, user.password as string);
});

userSchema.method("toggleHasAvatar", async function (hasAvatar: boolean) {
  this.hasAvatar = hasAvatar;
  await this.save();
});

userSchema.pre("save", async function (next) {
  // create UserSettings object if User is new
  if (this.isNew) {
    const settings = await UserSettings.create({});
    this.settings = settings._id;
  }
  // hash incoming new password
  if (this.password && this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  return next();
});

export const User: UserModel = mongoose.model<UserDocument, UserModel>(
  "User",
  userSchema
);

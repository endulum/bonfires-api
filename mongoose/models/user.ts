import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

import {
  UserDocument,
  UserModel,
  UserSchema,
  UserQuery,
} from "../interfaces/mongoose.gen";

const userSchema: UserSchema = new Schema({
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
});

userSchema.query.byNameOrId = function (nameOrId: string): UserQuery {
  if (mongoose.isValidObjectId(nameOrId)) return this.where({ id: nameOrId });
  return this.where({ username: nameOrId });
};

userSchema.method("updateUsername", async function (username: string) {
  this.username = username;
  await this.save();
});

userSchema.method("updateStatus", async function (bio: string) {
  this.status = bio;
  await this.save();
});

userSchema.method("updateGitHubUser", async function (ghUser: string) {
  this.ghUser = ghUser;
  await this.save();
});

userSchema.method("comparePassword", async function (password: string) {
  return this.password ? bcrypt.compare(password, this.password) : false;
});

userSchema.pre("save", async function (next) {
  // hash incoming new password
  if (this.password && !this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  return next();
});

export const User: UserModel = mongoose.model<UserDocument, UserModel>(
  "User",
  userSchema
);

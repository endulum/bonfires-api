import mongoose from "mongoose";

import { User } from "./models/user";
import { UserSettings } from "./models/userSettings";
import { Channel } from "./models/channel";
import { ChannelSettings } from "./models/channelSettings";
import { Message } from "./models/message";

export async function wipe() {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({})
    )
  );
}

export async function seed() {
  await wipe();
  const admin = await User.create({ username: "admin", password: "password" });
  await admin.save();
  return admin;
}

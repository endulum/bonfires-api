import mongoose from "mongoose";

import { User } from "./models/user";
import { UserSettings } from "./models/userSettings";
import { Channel } from "./models/channel";
import { ChannelSettings } from "./models/channelSettings";
import { Message } from "./models/message";

import * as fakes from "./fakes";
import { UserDocument } from "./interfaces/mongoose.gen";

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

export async function createBulkUsers(count: number) {
  const userData = fakes.bulkUsers(count);
  const users: UserDocument[] = [];
  await Promise.all(
    userData.map(async (ud) => {
      const user = await User.create({
        username: ud.username,
        status: ud.status,
        password: "password",
      });
      users.push(user);
    })
  );
  return users;
}

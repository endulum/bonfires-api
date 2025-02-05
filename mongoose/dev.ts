import mongoose from "mongoose";

import { User } from "./models/user";
import { UserSettings } from "./models/userSettings";
import { Channel } from "./models/channel";
import { ChannelSettings } from "./models/channelSettings";
import { Message } from "./models/message";

import * as fakes from "./fakes";
import { ChannelDocument, UserDocument } from "./interfaces/mongoose.gen";

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

export async function createBulkChannels(
  count: number,
  admins: UserDocument[]
) {
  const channelData = fakes.bulkChannels(count);
  const channels: ChannelDocument[] = [];
  await Promise.all(
    channelData.map(async (cd) => {
      const channel = await Channel.create({
        admin: admins[Math.floor(Math.random() * admins.length)],
        title: cd.title,
      });
      channels.push(channel);
    })
  );
  return channels;
}

export async function addUsersToChannels(
  users: { _id: string }[],
  channel: ChannelDocument
) {
  await channel.users.push(...users);
  await channel.save();
}

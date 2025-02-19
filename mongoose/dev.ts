import mongoose from "mongoose";

import { User } from "./models/user";
import { Channel } from "./models/channel";

import * as fakes from "./fakes";
import { ChannelDocument, UserDocument } from "./interfaces/mongoose.gen";

export async function wipe() {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({})
    )
  );
}

export async function wipeWithAdmin() {
  await wipe();
  const admin = await User.create({ username: "admin", password: "password" });
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
  owners: UserDocument[]
) {
  const channelData = fakes.bulkChannels(count);
  const channels: ChannelDocument[] = [];
  await Promise.all(
    channelData.map(async (cd) => {
      const channel = await Channel.create({
        owner: owners[Math.floor(Math.random() * owners.length)],
        title: cd.title,
        lastActivity: fakes.randDate(),
      });
      channels.push(channel);
    })
  );
  return channels;
}

export async function inviteUsersToChannels(
  users: UserDocument[],
  channels: ChannelDocument[],
  maxUsersPer?: number
) {
  await Promise.all(
    channels.map(async (channel) => {
      const memberCount = maxUsersPer
        ? Math.floor(Math.random() * maxUsersPer)
        : users.length;
      if (memberCount > 0)
        await channel.invite([
          ...users.sort(() => 0.5 - Math.random()).slice(0, memberCount),
        ]);
    })
  );
}

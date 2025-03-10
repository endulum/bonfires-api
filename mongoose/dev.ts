import mongoose from "mongoose";

import { User } from "./models/user";
import { Channel } from "./models/channel";

import * as fakes from "./fakes";
import { faker } from "@faker-js/faker";
import { ChannelDocument, UserDocument } from "./interfaces/mongoose.gen";
import { UserSettings } from "./models/userSettings";
import { Message } from "./models/message";

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
  const bulkUsers = fakes.bulkUsers(count);
  const users = await User.create(
    bulkUsers.map((u) => ({
      username: u.username,
      tagline: u.tagline,
      password: "password",
    }))
  );

  await UserSettings.bulkWrite(
    bulkUsers
      .filter((user) => user.defaultNameColor)
      .map((user) => {
        const { _id } = users.find((u) => u.username === user.username)!;
        return {
          updateOne: {
            filter: { user: _id },
            update: { $set: { defaultNameColor: user.defaultNameColor } },
          },
        };
      })
  );

  return users;
}

export async function createBulkChannels(
  count: number,
  ownerPool: UserDocument[]
) {
  const bulkChannels = fakes.bulkChannels(count);
  const channels = await Channel.create(
    bulkChannels.map((c) => ({
      owner: ownerPool[Math.floor(Math.random() * ownerPool.length)],
      title: c.title,
      lastActivity: fakes.randDate(),
    }))
  );
  return channels;
}

export async function inviteUsersToChannels(
  userPool: UserDocument[],
  channels: ChannelDocument[],
  maxUsersPer?: number
) {
  await Promise.all(
    channels.map(async (channel) => {
      const memberCount = maxUsersPer
        ? Math.floor(Math.random() * maxUsersPer)
        : userPool.length;
      if (memberCount > 0)
        await channel.inviteMany(
          [...userPool.sort(() => 0.5 - Math.random()).slice(0, memberCount)],
          channel.owner
        );
    })
  );
}

export async function createBulkMessages(
  channel: ChannelDocument,
  count: number
) {
  const bulkMessages = faker.helpers.uniqueArray(faker.lorem.sentence, count);
  const users = await User.find({ _id: { $in: channel.users } });
  const messages = await Message.create(
    bulkMessages.map((m) => ({
      channel: channel._id,
      user: users[Math.floor(Math.random() * users.length)]._id,
      content: m,
      timestamp: fakes.randDate(),
    }))
  );
  return messages;
}

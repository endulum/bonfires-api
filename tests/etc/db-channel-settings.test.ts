import { faker } from "@faker-js/faker";

import "../memoryServer";
import { createBulkUsers, wipeWithAdmin } from "../../mongoose/dev";
import { Channel } from "../../mongoose/models/channel";
import {
  UserDocument,
  ChannelDocument,
} from "../../mongoose/interfaces/mongoose.gen";
import { ChannelSettings } from "../../mongoose/models/channelSettings";

// ChannelSettings lets users have their own per server they're in:
// - name color (red name in one channel, blue name in another)
// - display name (their username in one channel, "Supreme Overlord" in another channel)
// - invisibility (can be seen typing and viewing in one channel but not another)

let admin: UserDocument | null = null;
const users: UserDocument[] = [];
let channel: ChannelDocument;

beforeAll(async () => {
  admin = await wipeWithAdmin();
});

describe("atomicity", () => {
  beforeAll(async () => {
    users.push(...(await createBulkUsers(10)));
    channel = await Channel.create({
      owner: admin,
      title: "It's A Channel",
    });
  });

  test("creates ChannelSettings if users are invited", async () => {
    await channel.invite(users);
    const channelSettings = await ChannelSettings.find({});
    expect(channelSettings.length).toBe(users.length + 1);
    expect(
      channelSettings.every(
        (settings) => settings.channel._id.toString() === channel._id.toString()
      )
    ).toBeTruthy();
  });

  test("removes ChannelSettings if users are kicked", async () => {
    await channel.kick(users);
    const channelSettings = await ChannelSettings.find({});
    expect(channelSettings.length).toBe(1);
  });

  test("removes ChannelSettings if channel is deleted", async () => {
    await channel.invite(users);
    await Channel.deleteOne({ _id: channel._id });
    const channelSettings = await ChannelSettings.find({});
    expect(channelSettings.length).toBe(0);
  });
});

describe("population", () => {
  beforeAll(async () => {
    channel = await Channel.create({
      owner: admin,
      title: "It's A Channel",
    });
    await channel.invite(users);
  });

  test("each user has `settings` and `channelSettings` properties", async () => {
    const query = await Channel.findOne().withUsersAndSettings(channel._id);
    if (!query) throw new Error("Query is undefined.");
    // console.dir(JSON.parse(JSON.stringify(query)), { depth: null });

    expect(
      query.users.every((user) => {
        return "settings" in user && "channelSettings" in user;
      })
    ).toBeTruthy();
  });

  test("`channelSettings` has defined properties when a user has channel settings", async () => {
    // assign random colors to five random users
    await Promise.all(
      users
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)
        .map(async (user) => {
          await ChannelSettings.updateOne(
            { user, channel },
            { nameColor: faker.internet.color() }
          );
        })
    );
    // assign random display names to five random users
    await Promise.all(
      users
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)
        .map(async (user) => {
          await ChannelSettings.updateOne(
            { user, channel },
            { displayName: faker.person.fullName() }
          );
        })
    );

    const query = await Channel.findOne().withUsersAndSettings(channel._id);
    if (!query) throw new Error("Query is undefined.");
    // console.dir(JSON.parse(JSON.stringify(query)), { depth: null });

    expect(
      query.users.filter(
        (user) => user.channelSettings.displayName !== undefined
      ).length
    ).toBe(5);
    expect(
      query.users.filter((user) => user.channelSettings.nameColor !== undefined)
        .length
    ).toBe(5);
  });

  test("can evaluate a user's preferred name and color", async () => {
    const query = JSON.parse(
      JSON.stringify(await Channel.findOne().withUsersAndSettings(channel._id))
    );
    const mappedUsers = query.users.map((user) => ({
      name: user.channelSettings.displayName ?? user.username,
      color: user.channelSettings.nameColor ?? user.settings.defaultNameColor,
    }));
    expect(mappedUsers.every((user) => user.name && user.color));
  });
});

import "../memoryServer";
import { createBulkUsers, seed } from "../../mongoose/dev";
import { Channel } from "../../mongoose/models/channel";
import {
  UserDocument,
  ChannelDocument,
} from "../../mongoose/interfaces/mongoose.gen";
import { ChannelSettings } from "../../mongoose/models/channelSettings";

let admin: UserDocument | null = null;

beforeAll(async () => {
  admin = await seed();
});

describe("atomicity", () => {
  let users: UserDocument[] = [];
  let channel: ChannelDocument;

  beforeAll(async () => {
    users = await createBulkUsers(10);
    channel = await Channel.create({
      admin,
      title: "Channel #1",
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

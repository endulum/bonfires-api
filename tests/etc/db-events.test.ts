import "../memoryServer";
import { assertCode, req, token } from "../helpers";
import { createBulkUsers, wipeWithAdmin } from "../../mongoose/dev";
import {
  ChannelDocument,
  UserDocument,
} from "../../mongoose/interfaces/mongoose.gen";
import { Channel } from "../../mongoose/models/channel";
import { Event } from "../../mongoose/models/event";

let channel: ChannelDocument;
let admin: UserDocument;
let adminToken: string;
let users: UserDocument[];

beforeAll(async () => {
  admin = await wipeWithAdmin();
  adminToken = await token("admin");
  users = await createBulkUsers(3);
  channel = await Channel.create({
    owner: admin,
    title: "It's a Channel",
    users: [users[0], users[1]],
  });
});

describe("each actionable thing leaves an event", () => {
  test("inviting a user", async () => {
    await channel.invite([users[2]], admin);
    const event = await Event.findOne({
      type: "user_invite",
      channel,
      user: admin,
      targetUser: users[2],
    });
    expect(event).not.toBeNull();
  });

  test("kicking a user", async () => {
    await channel.kick([users[2]], admin);
    const event = await Event.findOne({
      type: "user_kick",
      channel,
      user: admin,
      targetUser: users[2],
    });
    expect(event).not.toBeNull();
  });

  test("a user leaving", async () => {
    await channel.kick([users[1]]);
    const event = await Event.findOne({
      type: "user_leave",
      channel,
      user: users[1],
    });
    expect(event).not.toBeNull();
  });

  test("changing the channel title", async () => {
    await req(`PUT /channel/${channel._id}`, adminToken, {
      title: "Wow A Channel",
    });
    const event = await Event.findOne({
      type: "channel_title",
      channel,
      user: admin,
      newChannelTitle: "Wow A Channel",
    });
    expect(event).not.toBeNull();
  });

  test("pinning a message", async () => {
    const { body } = await req(
      `POST /channel/${channel._id}/messages`,
      adminToken,
      { content: "owo" }
    );
    await req(
      `PUT /channel/${channel._id}/message/${body._id}/pin`,
      adminToken,
      { pin: true }
    );
    const event = await Event.findOne({
      type: "message_pin",
      channel,
      user: admin,
      targetMessage: body._id,
    });
    expect(event).not.toBeNull();
  });
});

describe("GET /channel/:channel/messages", () => {
  test("fetching messages also fetches events", async () => {
    const response = await req(
      `GET /channel/${channel._id}/messages`,
      adminToken
    );
    assertCode(response, 200);
    expect(response.body).toHaveProperty("events");
    expect(response.body.events.length).toBe(5);
  });
});

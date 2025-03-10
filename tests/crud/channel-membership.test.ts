import "../memoryServer";
import { req, assertCode, token } from "../helpers";
import {
  createBulkUsers,
  createBulkChannels,
  wipeWithAdmin,
} from "../../mongoose/dev";
import { Channel } from "../../mongoose/models/channel";
import {
  ChannelDocument,
  UserDocument,
} from "../../mongoose/interfaces/mongoose.gen";

let admin: UserDocument;
let adminToken: string;

beforeAll(async () => {
  admin = await wipeWithAdmin();
  adminToken = await token("admin");
});

// see channels you and a user are both in.
describe("GET /user/:user/mutual", () => {
  test("gets mutual channels", async () => {
    const users = await createBulkUsers(2);
    const [channel] = await createBulkChannels(1, [admin]);
    await channel.inviteMany([users[0]]);
    // admin is admin of channel
    // user 0 is member of channel
    // user 1 is not member of channel

    // user 0 viewing admin
    let response = await req(
      "GET /user/admin/mutual",
      await token(users[0].username)
    );
    assertCode(response, 200);
    expect(response.body.length).toBe(1);

    // admin viewing user 0
    response = await req(`GET /user/${users[0]._id}/mutual`, adminToken);
    assertCode(response, 200);
    expect(response.body.length).toBe(1);

    // user 1 viewing admin
    response = await req(
      "GET /user/admin/mutual",
      await token(users[1].username)
    );
    assertCode(response, 200);
    expect(response.body.length).toBe(0);

    // admin viewing user 1
    response = await req(`GET /user/${users[1]._id}/mutual`, adminToken);
    assertCode(response, 200);
    expect(response.body.length).toBe(0);
  });
});

describe("POST /channel/:channel/leave", () => {
  let channel: ChannelDocument;
  const users: UserDocument[] = [];

  beforeAll(async () => {
    admin = await wipeWithAdmin();
    adminToken = await token("admin");
    channel = await Channel.create({
      owner: admin,
      title: "It's A Channel",
    });
    users.push(...(await createBulkUsers(2)));
    await channel.inviteMany(users);
    // channel should have three users - two bulks and one owner
  });

  test("200 and leaves a channel", async () => {
    let response = await req(
      `POST /channel/${channel._id}/leave`,
      await token(users[0].username)
    );
    assertCode(response, 200);
    response = await req(
      `GET /channel/${channel._id}`,
      await token(users[0].username)
    );
    assertCode(response, 403);
    response = await req(`GET /channel/${channel._id}`, adminToken);
    expect(response.body.users.length).toBe(2);
  });

  test("200 and if owner leaves channel, next oldest user becomes owner", async () => {
    let response = await req(`POST /channel/${channel._id}/leave`, adminToken);
    assertCode(response, 200);
    response = await req(
      `GET /channel/${channel._id}`,
      await token(users[1].username)
    );
    expect(response.body.users.length).toBe(1);
    expect(response.body.owner._id).toEqual(users[1]._id.toString());
  });

  test("200 and deletes channel if you were the last member", async () => {
    let response = await req(
      `POST /channel/${channel._id}/leave`,
      await token(users[1].username)
    );
    assertCode(response, 200);
    response = await req(`GET /channel/${channel._id}`, adminToken);
    assertCode(response, 404);
  });
});

describe("POST /channel/:channel/invite/:user", () => {
  let channel: ChannelDocument;
  const users: UserDocument[] = [];

  beforeAll(async () => {
    admin = await wipeWithAdmin();
    adminToken = await token("admin");
    channel = await Channel.create({
      owner: admin,
      title: "It's A Channel",
    });
    users.push(...(await createBulkUsers(2)));
    await channel.inviteMany([users[0]]);
  });

  test("400 if user is in channel", async () => {
    const response = await req(
      `POST /channel/${channel._id}/invite/${users[0]._id}`,
      adminToken
    );
    assertCode(response, 400, "This user is already in this channel.");
  });

  test("200 and adds user to channel", async () => {
    let response = await req(
      `POST /channel/${channel._id}/invite/${users[1]._id}`,
      adminToken
    );
    assertCode(response, 200);
    response = await req(`GET /channel/${channel._id}`, adminToken);
    expect(response.body.users.length).toBe(3);
  });
});

describe("POST /channel/:channel/kick/:user", () => {
  let channel: ChannelDocument;
  const users: UserDocument[] = [];

  beforeAll(async () => {
    admin = await wipeWithAdmin();
    adminToken = await token("admin");
    channel = await Channel.create({
      owner: admin,
      title: "It's A Channel",
    });
    users.push(...(await createBulkUsers(2)));
    await channel.inviteMany([users[0]]);
  });

  test("400 if user is not in channel", async () => {
    const response = await req(
      `POST /channel/${channel._id}/kick/${users[1]._id}`,
      adminToken
    );
    assertCode(response, 400, "This user is not in this channel.");
  });

  test("200 and removes user from channel", async () => {
    let response = await req(
      `POST /channel/${channel._id}/kick/${users[0]._id}`,
      adminToken
    );
    assertCode(response, 200);
    response = await req(`GET /channel/${channel._id}`, adminToken);
    expect(response.body.users.length).toBe(1);
  });
});

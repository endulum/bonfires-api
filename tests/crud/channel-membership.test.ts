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
    await channel.invite([users[0]]);
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
  let user: UserDocument;

  beforeAll(async () => {
    admin = await wipeWithAdmin();
    adminToken = await token("admin");
    channel = await Channel.create({
      admin,
      title: "It's A Channel",
    });
    user = (await createBulkUsers(1))[0];
    await channel.invite([user]);
  });

  test("403 if leaving a channel as admin", async () => {
    const response = await req(
      `POST /channel/${channel._id}/leave`,
      adminToken
    );
    assertCode(
      response,
      403,
      "You cannot leave a channel if you are its admin and there are other users in the channel. Please promote one of the other users of this channel to admin before leaving."
    );
  });

  test("200 and leaves a channel", async () => {
    let response = await req(
      `POST /channel/${channel._id}/leave`,
      await token(user.username)
    );
    assertCode(response, 200);
    response = await req(`GET /channel/${channel._id}`, adminToken);
    expect(response.body.users.length).toBe(1);
  });

  /* test("403 if leaving a channel you were never in", async () => {
    const response = await req(
      `POST /channel/${channel._id}/leave`,
      await token(user.username)
    );
    assertCode(response, 403);
  }); */ // move to permissions?

  test("200 and deletes channel if you were the last member", async () => {
    let response = await req(`POST /channel/${channel._id}/leave`, adminToken);
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
      admin,
      title: "It's A Channel",
    });
    users.push(...(await createBulkUsers(2)));
    await channel.invite([users[0]]);
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
      admin,
      title: "It's A Channel",
    });
    users.push(...(await createBulkUsers(2)));
    await channel.invite([users[0]]);
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

describe("POST /channel/:channel/promote/:user", () => {
  let channel: ChannelDocument;
  const users: UserDocument[] = [];

  beforeAll(async () => {
    admin = await wipeWithAdmin();
    adminToken = await token("admin");
    channel = await Channel.create({
      admin,
      title: "It's A Channel",
    });
    users.push(...(await createBulkUsers(2)));
    await channel.invite([users[0]]);
  });

  test("400 if user is not in channel", async () => {
    const response = await req(
      `POST /channel/${channel._id}/promote/${users[1]._id}`,
      adminToken
    );
    assertCode(response, 400, "This user is not in this channel.");
  });

  test("400 if trying to promote self", async () => {
    const response = await req(
      `POST /channel/${channel._id}/promote/${admin._id}`,
      adminToken
    );
    assertCode(response, 400, "You cannot promote yourself.");
  });

  test("200 and replaces admin", async () => {
    let response = await req(
      `POST /channel/${channel._id}/promote/${users[0]._id}`,
      adminToken
    );
    assertCode(response, 200);
    response = await req(`GET /channel/${channel._id}`, adminToken);
    expect(response.body.admin._id).toBe(users[0]._id.toString());
  });
});

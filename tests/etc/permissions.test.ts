import "../memoryServer";
import { assertCode, req, token } from "../helpers";
import { wipeWithAdmin, createBulkUsers } from "../../mongoose/dev";
import {
  ChannelDocument,
  UserDocument,
} from "../../mongoose/interfaces/mongoose.gen";
import { Channel } from "../../mongoose/models/channel";

let admin: UserDocument;
let channel: ChannelDocument;
const users: UserDocument[] = [];

describe("auth", () => {
  let adminToken: string;

  beforeAll(async () => {
    admin = await wipeWithAdmin();
    adminToken = await token("admin");
  });

  test("logout-only action", async () => {
    await Promise.all(
      ["POST /login", "POST /signup", "GET /github"].map(async (url) => {
        try {
          const response = await req(url, adminToken);
          assertCode(
            response,
            403,
            "You cannot perform this action when logged in."
          );
        } catch (e) {
          console.error(url);
          throw e;
        }
      })
    );
  });

  test("login-only action", async () => {
    // doesn't matter that the ids aren't valid,
    // it should not reach the middleware where that matters
    await Promise.all(
      [
        "GET /me",
        "PUT /me",
        "GET /user/owo",
        "GET /user/owo/mutual",
        "GET /channels",
        "POST /channels",
        "GET /channel/owo",
        "PUT /channel/owo",
        "DELETE /channel/owo",
        "POST /channel/owo/leave",
        "POST /channel/owo/invite/uwu",
        "POST /channel/owo/kick/uwu",
        "PUT /channel/owo/settings",
        "GET /channel/owo/messages",
        "POST /channel/owo/messages",
        "GET /channel/owo/pins",
        "PUT /channel/owo/message/uwu/pin",
      ].map(async (url) => {
        try {
          const response = await req(url);
          assertCode(response, 401, "Please log in.");
        } catch (e) {
          console.error(url);
          throw e;
        }
      })
    );
  });
});

describe("channel", () => {
  beforeAll(async () => {
    admin = await wipeWithAdmin();
    channel = channel = await Channel.create({
      title: "It's A Channel",
      owner: admin,
    });
    users.push(...(await createBulkUsers(3)));
    await channel.inviteMany([users[0]]);
  });

  test("member-only action", async () => {
    const strangerToken = await token(users[1].username);
    await Promise.all(
      [
        `GET /channel/${channel._id}`,
        `PUT /channel/${channel._id}`,
        `PUT /channel/${channel._id}/settings`,
        `POST /channel/${channel._id}/invite/${users[2]._id}`,
        `POST /channel/${channel._id}/kick/${users[2]._id}`,
        `POST /channel/${channel._id}/leave`,
        `GET /channel/${channel._id}/messages`,
        `POST /channel/${channel._id}/messages`,
        `GET /channel/${channel._id}/pins`,
        `PUT /channel/${channel._id}/message/owo/pin`,
      ].map(async (url) => {
        try {
          const response = await req(url, strangerToken);
          assertCode(response, 403, "You are not in this channel.");
        } catch (e) {
          console.error(url);
          throw e;
        }
      })
    );
  });

  test("admin-only action", async () => {
    const memberToken = await token(users[0].username);
    await Promise.all(
      [
        `DELETE /channel/${channel._id}`,
        `POST /channel/${channel._id}/kick/${users[0]._id}`,
      ].map(async (url) => {
        try {
          const response = await req(url, memberToken);
          assertCode(response, 403, "You are not the owner of this channel.");
        } catch (e) {
          console.error(url);
          throw e;
        }
      })
    );
  });
});

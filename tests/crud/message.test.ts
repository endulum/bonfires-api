import "../memoryServer";
import { req, assertCode, assertInputErrors, token, logBody } from "../helpers";
import { wipeWithAdmin } from "../../mongoose/dev";
import { Channel } from "../../mongoose/models/channel";
import {
  ChannelDocument,
  UserDocument,
} from "../../mongoose/interfaces/mongoose.gen";

let adminToken: string = "";
let admin: UserDocument;
let channel: ChannelDocument;
let messageId: string;

beforeAll(async () => {
  admin = await wipeWithAdmin();
  adminToken = await token("admin");
  channel = await Channel.create({
    owner: admin,
    title: "It's A Channel",
  });
});

describe("POST /channel/:channel/messages", () => {
  const correctInputs = { content: "Hi" };
  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: [`POST /channel/${channel._id}/messages`, adminToken],
      correctInputs,
      wrongInputs: [
        { content: "" },
        { content: Array(1001).fill("A").join("") },
      ],
    });
  });

  test("200 and returns message + updates the `lastActivity` of a channel", async () => {
    let response = await req(
      `POST /channel/${channel._id}/messages`,
      adminToken,
      correctInputs
    );
    assertCode(response, 200);
    messageId = response.body.message._id;
    const timestamp = response.body.message.timestamp;

    response = await req(`GET /channel/${channel._id}`, adminToken);
    expect(response.body.lastActivity).toEqual(timestamp);
  });
});

describe("POST /channel/:channel/message/:message/pin", () => {
  test("400 if unpinning an unpinned message", async () => {
    const response = await req(
      `PUT /channel/${channel._id}/message/${messageId}/pin`,
      adminToken,
      { pin: "false" }
    );
    assertCode(response, 400, "This message was never pinned.");
  });

  test("200 and pins", async () => {
    const response = await req(
      `PUT /channel/${channel._id}/message/${messageId}/pin`,
      adminToken,
      { pin: "true" }
    );
    assertCode(response, 200);
  });

  test("400 if pinning a pinned message", async () => {
    const response = await req(
      `PUT /channel/${channel._id}/message/${messageId}/pin`,
      adminToken,
      { pin: "true" }
    );
    assertCode(response, 400, "This message is already pinned.");
  });

  test("200 and unpins", async () => {
    const response = await req(
      `PUT /channel/${channel._id}/message/${messageId}/pin`,
      adminToken,
      { pin: "false" }
    );
    assertCode(response, 200);
  });
});

describe("GET /channel/:channel/message/:message", () => {
  test("404 if not found", async () => {
    const response = await req(
      `GET /channel/${channel._id}/message/owo`,
      adminToken
    );
    assertCode(response, 404);
  });

  test("200 and shows message", async () => {
    const response = await req(
      `GET /channel/${channel._id}/message/${messageId}`,
      adminToken
    );
    assertCode(response, 200);
    logBody(response);
  });
});

describe("PUT /channel/:channel/message/:message", () => {
  const correctInputs = { content: "Hello" };
  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: [`PUT /channel/${channel._id}/message/${messageId}`, adminToken],
      correctInputs,
      wrongInputs: [
        { content: "" },
        { content: Array(1001).fill("A").join("") },
      ],
    });
  });

  test("200 and returns message + updates the `lastEdited` of the message", async () => {
    const response = await req(
      `PUT /channel/${channel._id}/message/${messageId}`,
      adminToken,
      correctInputs
    );
    assertCode(response, 200);
    expect(response.body.message.lastEdited).toBeDefined();
  });
});

describe("DELETE /channel/:channel/message/:message", () => {
  test("200 and deletes", async () => {
    let response = await req(
      `DELETE /channel/${channel._id}/message/${messageId}`,
      adminToken
    );
    assertCode(response, 200);

    // it should no longer exist
    response = await req(
      `GET /channel/${channel._id}/message/${messageId}`,
      adminToken
    );
    assertCode(response, 404);
  });
});

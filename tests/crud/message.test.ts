import "../memoryServer";
import { req, assertCode, assertInputErrors, token } from "../helpers";
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
    messageId = response.body._id;
    const timestamp = response.body.timestamp;

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

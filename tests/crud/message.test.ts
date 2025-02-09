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

beforeAll(async () => {
  admin = await wipeWithAdmin();
  adminToken = await token("admin");
  channel = await Channel.create({
    admin,
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
    const timestamp = response.body.timestamp;

    response = await req(`GET /channel/${channel._id}`, adminToken);
    expect(response.body.lastActivity).toEqual(timestamp);
  });
});

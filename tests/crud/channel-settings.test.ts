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

describe("PUT /channel/:channel/settings", () => {
  const correctInputs = {
    displayName: "Supreme Overlord",
    nameColor: "#f0f0f0",
    invisible: "true",
  };

  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: [`PUT /channel/${channel._id}/settings`, adminToken],
      correctInputs,
      wrongInputs: [
        { displayName: Array(1000).fill("A").join("") },
        { nameColor: Array(1000).fill("A").join("") },
        { invisible: Array(1000).fill("A").join("") },
      ],
    });
  });

  test("200 and applies custom settings to channel", async () => {
    let response = await req(
      `PUT /channel/${channel._id}/settings`,
      adminToken,
      correctInputs
    );
    assertCode(response, 200);

    // check settings in channel response
    response = await req(`GET /channel/${channel._id}`, adminToken);
    const userJSON = response.body.users.find(
      (user) => user._id === admin._id.toString()
    );
    expect(userJSON.channelSettings).toHaveProperty("displayName");
    expect(userJSON.channelSettings).toHaveProperty("nameColor");
  });

  test("200 and resets custom settings", async () => {
    let response = await req(
      `PUT /channel/${channel._id}/settings`,
      adminToken,
      {}
    );
    assertCode(response, 200);

    // check settings in channel response
    response = await req(`GET /channel/${channel._id}`, adminToken);
    const userJSON = response.body.users.find(
      (user) => user._id === admin._id.toString()
    );
    expect(userJSON.channelSettings).not.toHaveProperty("displayName");
    expect(userJSON.channelSettings).not.toHaveProperty("nameColor");
  });
});

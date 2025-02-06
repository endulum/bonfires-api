import "../memoryServer";
import { req, assertCode, assertInputErrors, token, logBody } from "../helpers";
import { createBulkUsers, seed } from "../../mongoose/dev";
import { Channel } from "../../mongoose/models/channel";
import { ChannelDocument } from "../../mongoose/interfaces/mongoose.gen";

let adminToken: string = "";
let channelId: string | null = null;

beforeAll(async () => {
  await seed();
  adminToken = await token("admin");
});

describe("POST /channels", () => {
  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: ["POST /channels", adminToken],
      correctInputs: { title: "Channel Title" },
      wrongInputs: [
        { title: "" },
        { title: "a" },
        { title: Array(1000).fill("A").join("") },
      ],
    });
  });

  test("200 and creates channel with self as admin", async () => {
    const response = await req("POST /channels", adminToken, {
      title: "Channel Title",
    });
    expect(response.body._id).toBeDefined();
    channelId = response.body._id;
  });
});

describe("GET /channel/:channel", () => {
  beforeAll(async () => {
    const users = await createBulkUsers(3);
    const channel: ChannelDocument | null = await Channel.findById(channelId);
    if (channel) channel.invite(users);
  });

  test("404 if not found", async () => {
    const response = await req("GET /channel/owo", adminToken);
    assertCode(response, 404);
  });

  test("200 and channel details", async () => {
    const response = await req(`GET /channel/${channelId}`, adminToken);
    assertCode(response, 200);
    logBody(response);
    expect(response.body.users.length).toBe(4);
  });
});

describe("PUT /channel/:channel", () => {
  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: [`PUT /channel/${channelId}`, adminToken],
      correctInputs: { title: "New Channel Title" },
      wrongInputs: [
        { title: "" },
        { title: "a" },
        { title: Array(1000).fill("A").join("") },
      ],
    });
  });

  test("200 and edits channel detail", async () => {
    let response = await req(`PUT /channel/${channelId}`, adminToken, {
      title: "New Channel Title",
    });
    assertCode(response, 200);

    response = await req(`GET /channel/${channelId}`, adminToken);
    expect(response.body.title).toBe("New Channel Title");
  });
});

describe("DELETE /channel/:channel", () => {
  test("400 and errors", async () => {
    await assertInputErrors({
      reqArgs: [`DELETE /channel/${channelId}`, adminToken],
      correctInputs: { title: "New Channel Title" },
      wrongInputs: [
        { title: "" },
        { title: "a" },
        { title: Array(1000).fill("A").join("") },
      ],
    });
  });

  test("200 and deletes channel", async () => {
    let response = await req(`DELETE /channel/${channelId}`, adminToken, {
      title: "New Channel Title",
    });
    assertCode(response, 200);

    response = await req(`GET /channel/${channelId}`, adminToken);
    assertCode(response, 404);
  });
});

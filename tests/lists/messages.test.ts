import "../memoryServer";
import { req, assertCode, token } from "../helpers";
import { assertPagination } from "./listHelpers";
import { wipeWithAdmin, createBulkMessages } from "../../mongoose/dev";
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
    owner: admin,
    title: "It's A Channel",
  });
});

describe("GET /channel/:channel/messages", () => {
  beforeAll(async () => {
    await createBulkMessages(channel, 100);
  });

  test("200 and shows max 30 messages by default", async () => {
    const response = await req(
      `GET /channel/${channel._id}/messages`,
      adminToken
    );
    assertCode(response, 200);
    expect(response.body.messages).toBeDefined();
    expect(response.body.messages.length).toBe(30);
    expect(
      [...response.body.messages].sort(
        (comm_a: { timestamp: string }, comm_b: { timestamp: string }) =>
          Date.parse(comm_b.timestamp) - Date.parse(comm_a.timestamp)
      )
    ).toEqual(response.body.messages);
  });

  test("stable pagination", async () => {
    await assertPagination({
      reqArgs: [`GET /channel/${channel._id}/messages`, adminToken],
      expectedProperty: "messages",
      expectedTotal: 100,
      expectedPerPage: 30,
    });
  });

  test("preserves take", async () => {
    await assertPagination({
      reqArgs: [`GET /channel/${channel._id}/messages?take=10`, adminToken],
      expectedProperty: "messages",
      expectedTotal: 100,
      expectedPerPage: 10,
    });
  });
});

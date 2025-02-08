import "../memoryServer";
import { token } from "../helpers";
import { assertPagination } from "./listHelpers";
import { seed } from "../../mongoose/dev";
import { Channel } from "../../mongoose/models/channel";
import {
  ChannelDocument,
  UserDocument,
} from "../../mongoose/interfaces/mongoose.gen";
import { Message } from "../../mongoose/models/message";
import { faker } from "@faker-js/faker";

let adminToken: string = "";
let admin: UserDocument;
let channel: ChannelDocument;

beforeAll(async () => {
  admin = await seed();
  adminToken = await token("admin");
  channel = await Channel.create({
    admin,
    title: "It's A Channel",
  });
});

describe("GET /channel/:channel/messages", () => {
  beforeAll(async () => {
    await Message.insertMany(
      Array(25)
        .fill({ user: admin, channel })
        .map((msg) => ({
          ...msg,
          content: faker.lorem.sentence(),
          timestamp: faker.date.between({
            from: "2020-01-01T00:00:00.000Z",
            to: "2025-01-01T00:00:00.000Z",
          }),
        }))
    );
  });

  test("200 and shows paginated list of messages", async () => {
    await assertPagination({
      reqArgs: [`GET /channel/${channel._id}/messages`, adminToken],
      expectedProperty: "messages",
      expectedTotal: 25,
      expectedPerPage: 5,
    });
  });
});

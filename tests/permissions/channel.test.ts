import "../memoryServer";
import { assertCode, req, token } from "../helpers";
import { seed, createBulkUsers } from "../../mongoose/dev";
import {
  ChannelDocument,
  UserDocument,
} from "../../mongoose/interfaces/mongoose.gen";
import { Channel } from "../../mongoose/models/channel";

let channel: ChannelDocument;
const users: UserDocument[] = [];

beforeAll(async () => {
  const admin = await seed();
  channel = await Channel.create({
    title: "It's A Channel",
    admin,
  });
  users.push(...(await createBulkUsers(3)));
  await channel.invite([users[0]]);
});

test("member-only action", async () => {
  const strangerToken = await token(users[1].username);
  await Promise.all(
    [
      `GET /channel/${channel._id}`,
      `POST /channel/${channel._id}/invite/${users[2]._id}`,
      `POST /channel/${channel._id}/messages`,
      `GET /channel/${channel._id}/messages`,
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
      `PUT /channel/${channel._id}`,
      `DELETE /channel/${channel._id}`,
      `POST /channel/${channel._id}/kick/${users[0]._id}`,
      `POST /channel/${channel._id}/promote/${users[0]._id}`,
    ].map(async (url) => {
      try {
        const response = await req(url, memberToken);
        assertCode(response, 403, "You are not the admin of this channel.");
      } catch (e) {
        console.error(url);
        throw e;
      }
    })
  );
});

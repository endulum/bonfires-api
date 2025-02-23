import "../memoryServer";
import { assertCode, req, token } from "../helpers";
import { assertPagination } from "./listHelpers";
import {
  createBulkUsers,
  createBulkChannels,
  wipeWithAdmin,
} from "../../mongoose/dev";
import { UserDocument } from "../../mongoose/interfaces/mongoose.gen";

let adminToken: string = "";
let admin: UserDocument;
const users: UserDocument[] = [];
const channelCount = 50;

beforeAll(async () => {
  admin = await wipeWithAdmin();
  adminToken = await token("admin");
});

describe("GET /channels", () => {
  beforeAll(async () => {
    users.push(...(await createBulkUsers(2)));
    const channels = await createBulkChannels(50, [admin]);
    await Promise.all(
      channels.slice(0, channelCount / 2).map(async (channel) => {
        await channel.invite([users[0]]);
      })
    );
    await Promise.all(
      channels.slice(channelCount / 2, channelCount).map(async (channel) => {
        await channel.invite([users[1]]);
      })
    );
  });

  test("show max 15 channels, activity descending by default", async () => {
    const response = await req("GET /channels", adminToken);
    assertCode(response, 200);
    expect(response.body.channels).toBeDefined();
    expect(response.body.channels.length).toBe(15);
    expect(
      [...response.body.channels].sort(
        (comm_a: { lastActivity: string }, comm_b: { lastActivity: string }) =>
          Date.parse(comm_b.lastActivity) - Date.parse(comm_a.lastActivity)
      )
    ).toEqual(response.body.channels);
  });

  test("does not include channels you are not in", async () => {
    const { body: userOneRes } = await req(
      "GET /channels",
      await token(users[0].username)
    );
    const { body: userTwoRes } = await req(
      "GET /channels",
      await token(users[1].username)
    );

    // all unique channels, to show that results aren't intersecting
    expect(
      new Set([
        ...userOneRes.channels.map(({ _id }: { _id: string }) => _id),
        ...userTwoRes.channels.map(({ _id }: { _id: string }) => _id),
      ]).size
    ).toEqual(30);
  });

  describe("query params", () => {
    test("take", async () => {
      const response = await req("GET /channels?take=20", adminToken);
      assertCode(response, 200);
      expect(response.body.channels.length).toBe(20);
    });

    test("name", async () => {
      const response = await req("GET /channels?title=the", adminToken);
      assertCode(response, 200);
      expect(
        response.body.channels.filter(({ title }: { title: string }) =>
          title.toLocaleLowerCase().includes("the")
        )
      ).toEqual(response.body.channels);
    });
  });

  test("stable pagination", async () => {
    await assertPagination({
      reqArgs: ["GET /channels", adminToken],
      expectedPerPage: 15,
      expectedTotal: 50,
      expectedProperty: "channels",
    });
  });

  test("pagination preserves other queries", async () => {
    await assertPagination({
      reqArgs: ["GET /channels?take=5&title=e", adminToken],
      expectedPerPage: 5,
      expectedProperty: "channels",
      perPageAssertion: async (response) => {
        if (response.body.links.nextPage !== null)
          expect(response.body.channels.length).toBe(5);
        expect(
          response.body.channels.filter(({ title }: { title: string }) =>
            title.toLocaleLowerCase().includes("e")
          )
        ).toEqual(response.body.channels);
      },
    });
  });
});

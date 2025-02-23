import { close } from "./connectionClient";
import * as dev from "./dev";
import { empty as emptyBucket } from "../supabase/client";
import { Channel } from "./models/channel";

async function main() {
  await emptyBucket();
  const admin = await dev.wipeWithAdmin();

  await dev.inviteUsersToChannels(
    await dev.createBulkUsers(20),
    await dev.createBulkChannels(5, [admin]),
    10
  );

  for (const channel of await Channel.find())
    await dev.createBulkMessages(channel, 100);

  // keep for future ref
  /* await UserSettings.updateMany(
    {
      user: { $ne: admin },
    },
    [
      {
        $set: {
          defaultNameColor: {
            $function: {
              body: `function() {
                return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
              }`,
              args: [],
              lang: "js",
            },
          },
          defaultInvisible: {
            $function: {
              body: `function() {
                const rand = Math.floor(Math.random() * 5);
                return rand === 0
              }`,
              args: [],
              lang: "js",
            },
          },
        },
      },
    ]
  );

  await ChannelSettings.updateMany(
    {
      user: { $ne: admin },
    },
    [
      {
        $set: {
          displayName: {
            $function: {
              body: `function() {
                return Array(Math.floor(Math.random() * 32))
                .fill()
                .map(() => String.fromCharCode(97 + Math.floor(Math.random() * 26)))
                .join('');
              }`,
              args: [],
              lang: "js",
            },
          },
          nameColor: {
            $function: {
              body: `function() {
                return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
              }`,
              args: [],
              lang: "js",
            },
          },
        },
      },
    ]
  ); */
}

main()
  .catch((e) => console.error(e))
  .finally(() => close());

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
}

main()
  .catch((e) => console.error(e))
  .finally(() => close());

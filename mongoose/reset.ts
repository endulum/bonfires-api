import { close } from "./connectionClient";
import * as dev from "./dev";
import { empty as emptyBucket } from "../supabase/client";
import { Channel } from "./models/channel";

async function main() {
  await emptyBucket();
  const admin = await dev.wipeWithAdmin();

  /*
  
  // create users
  const users = await dev.createBulkUsers(20);

  // create channels, with admin as owner
  const channels = await dev.createBulkChannels(5, [admin])

  // invite users en masse to channels (max 10 users per channel)
  await dev.inviteUsersToChannels(users, channels, 10)

  // populate existing channels with messages
  for (const channel of await Channel.find())
    await dev.createBulkMessages(channel, 100);

  */
}

main()
  .catch((e) => console.error(e))
  .finally(() => close());

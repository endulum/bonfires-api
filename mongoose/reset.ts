import "./connectionClient";
import * as dev from "./dev";
import { empty as emptyBucket } from "../supabase/client";

async function main() {
  await emptyBucket();
  const admin = await dev.wipeWithAdmin();

  await dev.inviteUsersToChannels(
    await dev.createBulkUsers(50),
    await dev.createBulkChannels(10, [admin]),
    10
  );

  console.warn("finished");
}

main().catch((e) => console.error(e));

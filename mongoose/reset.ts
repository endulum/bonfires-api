import "./connectionClient";
import { wipeWithAdmin } from "./dev";
import { token } from "../tests/helpers";
import { empty } from "../supabase/client";

async function main() {
  await empty();
  await wipeWithAdmin();
  console.log(await token("admin"));
}

main().catch((e) => console.error(e));

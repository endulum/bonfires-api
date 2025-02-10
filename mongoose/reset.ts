import "./connectionClient";
import { wipeWithAdmin } from "./dev";
import { token } from "../tests/helpers";

async function main() {
  await wipeWithAdmin();
  console.log(await token("admin"));
}

main().catch((e) => console.error(e));

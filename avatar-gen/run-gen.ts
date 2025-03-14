import sharp from "sharp";
import { generateUserAvatar } from "./gen";
import path from "path";

async function main() {
  await sharp(await generateUserAvatar()).toFile(
    path.resolve(__dirname, "test.webp")
  );
}

main().catch((e) => console.error(e));

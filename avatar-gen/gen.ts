import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

async function main() {
  const animals = await fs.readdir(path.resolve(__dirname, "assets"));
  const colors = [
    "#eb6f92",
    "#f6c177",
    "#ebbcba",
    "#31748f",
    "#9ccfd8",
    "#c4a7e7",
  ];

  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: colors[Math.floor(Math.random() * colors.length)],
    },
  })
    .composite([
      {
        input: await sharp(
          path.resolve(
            __dirname,
            "assets",
            animals[Math.floor(Math.random() * animals.length)]
          )
        )
          .resize(60, 60)
          .negate({ alpha: false })
          .toBuffer(),
        gravity: "center",
      },
    ])
    .webp({ nearLossless: true })
    .toFile(path.resolve(__dirname, "solid-color-square.webp"));
}

main().catch((e) => console.error(e));

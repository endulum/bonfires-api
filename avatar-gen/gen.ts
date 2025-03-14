import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export async function generateUserAvatar() {
  const animals = await fs.readdir(path.resolve(__dirname, "assets"));
  const colors = [
    "#eb6f92",
    "#f6c177",
    "#ebbcba",
    "#31748f",
    "#9ccfd8",
    "#c4a7e7",
  ];

  const buffer = await sharp({
    create: {
      width: 150,
      height: 150,
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
          .resize(90, 90)
          .negate({ alpha: false })
          .toBuffer(),
        gravity: "center",
      },
    ])
    .webp({ nearLossless: true })
    .toBuffer();

  return buffer;
}

/*

- automatically generate new pfps for all new users
- create screenshots
- automatically generate starter welcome channel for all new users
- readme

*/

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabase = createClient(
  process.env.SUPABASE_URL ||
    (function () {
      throw new Error("Supabase URL was not provided.");
    })(),
  process.env.SUPABASE_SERVICE_KEY ||
    (function () {
      throw new Error("Supabase service key was not provided.");
    })()
);

const bucketName = `bonfires_${process.env.NODE_ENV}`;

// perform a check on server run so we can throw an error right away
// if the buckets we're expecting don't exist
async function checkBucket() {
  const { error } = await supabase.storage.getBucket(bucketName);
  if (error) throw error;
}

checkBucket();

export async function empty() {
  const { error: deleteError } = await supabase.storage.emptyBucket(bucketName);
  if (deleteError) throw deleteError;
}

function sharedToNormal(buffer: SharedArrayBuffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  const source = new Uint8Array(buffer);
  const target = new Uint8Array(arrayBuffer);
  target.set(source);
  return arrayBuffer;
}

export async function getWebpBuffer(
  file: Express.Multer.File
): Promise<ArrayBuffer> {
  const webpBuffer = await sharp(file.buffer, { animated: true })
    .resize({
      width: 128,
      height: 128,
      fit: "cover",
    })
    .webp()
    .toBuffer();
  if (webpBuffer.buffer instanceof SharedArrayBuffer)
    return sharedToNormal(webpBuffer.buffer);
  else return webpBuffer.buffer;
}

export async function upload(
  file: Express.Multer.File,
  id: { channelId: string } | { userId: string }
) {
  const buffer = await getWebpBuffer(file);

  const filePath = `${"channelId" in id ? "channelAvatars" : "userAvatars"}/${
    "channelId" in id ? id.channelId : id.userId
  }`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, { contentType: "image/webp", upsert: true });
  if (error) throw error;
}

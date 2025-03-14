import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { ofetch } from "ofetch";
import { Readable } from "stream";

import * as redis from "../redis/client";
import { generateUserAvatar } from "../avatar-gen/gen";

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
  if (error) {
    console.warn(`error with bucket name: ${bucketName}`);
    throw error;
  }
}

checkBucket();

export async function empty() {
  const { error: deleteError } = await supabase.storage.emptyBucket(bucketName);
  if (deleteError) throw deleteError;
}

function sharedToNormal(buffer: ArrayBuffer | SharedArrayBuffer) {
  if (buffer instanceof SharedArrayBuffer) {
    const arrayBuffer = new ArrayBuffer(buffer.byteLength);
    const source = new Uint8Array(buffer);
    const target = new Uint8Array(arrayBuffer);
    target.set(source);
    return arrayBuffer;
  } else return buffer;
}

export async function getWebpBuffer(buffer: Buffer): Promise<ArrayBuffer> {
  const webpBuffer = await sharp(buffer, { animated: true })
    .resize({
      width: 128,
      height: 128,
      fit: "cover",
    })
    .webp()
    .toBuffer();
  return sharedToNormal(webpBuffer.buffer);
}

export async function upload(
  file: Express.Multer.File,
  id: { channelId: string } | { userId: string }
) {
  const arrayBuffer = await getWebpBuffer(file.buffer);

  const filePath = `${"channelId" in id ? "channelAvatars" : "userAvatars"}/${
    "channelId" in id ? id.channelId : id.userId
  }`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, arrayBuffer, { contentType: "image/webp", upsert: true });
  if (error) throw error;
  redis.addCachedFile(filePath, Buffer.from(arrayBuffer));
}

async function getSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 30);
  if (error) throw error;
  return data.signedUrl;
}

async function getBuffer(filePath: string) {
  // try getting buffer from redis first
  const redisBuffer = await redis.findCachedFile(filePath);
  if (redisBuffer) return redisBuffer;

  // then get buffer from fetch
  const signedUrl = await getSignedUrl(filePath);
  const response = await ofetch.raw(signedUrl, {
    responseType: "arrayBuffer",
  });
  const supabaseBuffer = response._data;
  if (!supabaseBuffer)
    throw new Error("Error loading file from bucket: Buffer is empty.");

  const buffer = Buffer.from(supabaseBuffer);
  // store this buffer in redis before returning it
  await redis.addCachedFile(filePath, buffer);
  return buffer;
}

export async function getReadable(
  id: { channelId: string } | { userId: string }
): Promise<Readable | null> {
  const filePath = `${"channelId" in id ? "channelAvatars" : "userAvatars"}/${
    "channelId" in id ? id.channelId : id.userId
  }`;

  try {
    const buffer = await getBuffer(filePath);
    const readable = Readable.from(buffer);
    return readable;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function uploadFromUrl(url: string, userId: string) {
  // first, retrieve from github
  const response = await ofetch.raw(url, {
    responseType: "arrayBuffer",
  });
  const ghBuffer = response._data;
  if (!ghBuffer) {
    console.warn("Could not fetch avatar from GitHub");
    return;
  }

  // then, convert to cropped webp
  const arrayBuffer = await getWebpBuffer(Buffer.from(ghBuffer));

  // finally, upload
  const filePath = `userAvatars/${userId}`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, arrayBuffer, { contentType: "image/webp", upsert: true });
  if (error) {
    console.warn("Could not upload GitHub avatar", error);
    return;
  }
  redis.addCachedFile(filePath, Buffer.from(arrayBuffer));
}

export async function createUserAvatar(userId: string) {
  const arrayBuffer = sharedToNormal((await generateUserAvatar()).buffer);
  const filePath = `userAvatars/${userId}`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, arrayBuffer, { contentType: "image/webp", upsert: true });
  if (error) {
    console.warn("Could not upload GitHub avatar", error);
    return;
  }
  redis.addCachedFile(filePath, Buffer.from(arrayBuffer));
}

export async function del(id: { channelId: string } | { userId: string }) {
  const filePath = `${"channelId" in id ? "channelAvatars" : "userAvatars"}/${
    "channelId" in id ? id.channelId : id.userId
  }`;

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) throw error;
}

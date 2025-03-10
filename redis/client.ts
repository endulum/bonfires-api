import { createClient, commandOptions } from "redis";

const client = createClient({
  url:
    process.env.REDIS_URL ||
    (function () {
      throw new Error("Redis URL is missing.");
    })(),
});

client.on("error", (err) => console.error("Redis Client Error", err));
client.connect();

export async function findCachedFile(fileId: string) {
  const buffer = await client.get(
    commandOptions({ returnBuffers: true }),
    `BONFIRES_avatar_${fileId}`
  );
  return buffer ?? null;
}

export async function addCachedFile(fileId: string, buffer: Buffer) {
  await client.setEx(`BONFIRES_avatar_${fileId}`, 3600, buffer);
}

type User = {
  _id: string;
  username: string;
  invisible: boolean;
};

export async function getChannelActive(channelId: string) {
  const key = `BONFIRES_channel_${channelId}`;
  const existingActive = await client.get(key);

  // if there's nothing at this key, return nothing
  if (!existingActive) return null;

  const existing: User[] = JSON.parse(existingActive);
  if (existing.length > 0) return existing;

  // if the array at this key is empty, delete the key
  await client.del(key);
  return null;
}

export async function updateChannelActive(
  channelId: string,
  type: "add" | "remove",
  user: User
) {
  const key = `BONFIRES_channel_${channelId}`;
  const existingActive = await getChannelActive(channelId);

  // if user is invisible, don't change anything
  if (user.invisible) return existingActive;

  if (existingActive) {
    if (type === "add" && !existingActive.find((u) => u._id === user._id)) {
      await client.set(key, JSON.stringify([...existingActive, user]));
    } else {
      await client.set(
        key,
        JSON.stringify(existingActive.filter((u) => u._id !== user._id))
      );
    }
  } else {
    if (type === "add") await client.set(key, JSON.stringify([user]));
  }

  // now that it's updated, re-fetch and return
  return await getChannelActive(channelId);
}

export { client };

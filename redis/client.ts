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
    `avatar_${fileId}`
  );
  return buffer ?? null;
}

export async function addCachedFile(fileId: string, buffer: Buffer) {
  await client.setEx(`avatar_${fileId}`, 3600, buffer);
}

type User = {
  _id: string;
  username: string;
};

export async function updateChannelActive(
  channelId: string,
  type: "add" | "remove",
  user: User
) {
  const existingActive = await client.get(`channel_${channelId}`);
  if (existingActive) {
    const active: User[] = JSON.parse(existingActive);
    if (type === "add" && !active.find((u) => u._id === user._id)) {
      await client.set(
        `channel_${channelId}`,
        JSON.stringify([...active, user])
      );
    } else {
      await client.set(
        `channel_${channelId}`,
        JSON.stringify(active.filter((u) => u._id !== user._id))
      );
    }
  } else {
    await client.set(`channel_${channelId}`, JSON.stringify([user]));
  }

  const updatedActive = await client.get(`channel_${channelId}`);
  if (!updatedActive) return null;
  const updated: User[] = JSON.parse(updatedActive);
  if (updated.length > 0) return updated;
  // just delete the key if nobody's active
  await client.del(`channel_${channelId}`);
  return null;
}

export { client };

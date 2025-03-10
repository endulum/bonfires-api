import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let server: MongoMemoryServer;

async function init() {
  server = await MongoMemoryServer.create();
  const mongoUri = server.getUri();

  mongoose.connect(mongoUri).catch((e) => console.error(e));
}

async function close() {
  if (mongoose.connection !== null) {
    await mongoose.connection.close();
  }

  if (server) {
    await server.stop();
  }
}

export { init, close };

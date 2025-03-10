import mongoose from "mongoose";

mongoose.connect(
  process.env.MONGO_URI ??
    (function () {
      throw new Error("Mongo URI is not defined.");
    })()
);

export async function close() {
  console.warn("closing connection");
  if (mongoose.connection !== null) {
    await mongoose.connection.close();
  }
}

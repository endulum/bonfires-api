import mongoose from "mongoose";

mongoose.connect(
  process.env.MONGO_URI ??
    (function () {
      throw new Error("Mongo URI is not defined.");
    })()
);

import dotenv from "dotenv";
import express from "express";
import asyncHandler from "express-async-handler";
import cors from "cors";
import logger from "morgan";
import multer from "multer";

import { Server } from "socket.io";
import { createServer } from "http";

import { errorHandler } from "./src/middleware/errorHandler";
import { router } from "./src/router";

dotenv.config({ path: ".env" });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
console.warn(`environment: ${process.env.NODE_ENV}`);

import "./mongoose/connectionClient";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL },
});
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors({ origin: process.env.FRONTEND_URL }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.single("upload"));

// add io to req
app.use(async (req, _res, next) => {
  req.io = io;
  return next();
});

// suppress favicon request
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// in dev, log method and given values
if (process.env.NODE_ENV === "development") {
  app.use(logger("dev"));
  app.use(
    asyncHandler(async (req, _res, next) => {
      if (["POST", "PUT"].includes(req.method))
        // eslint-disable-next-line no-console
        console.dir(req.body, { depth: null });
      if (req.method === "GET" && Object.keys(req.params).length > 1)
        // eslint-disable-next-line no-console
        console.dir(req.params, { depth: null });
      next();
    })
  );
}

app.use(router);

app.use(
  "*",
  asyncHandler(async (_req, res) => {
    res.sendStatus(404);
  })
);

app.use(errorHandler);

io.on("connection", async (socket) => {
  /* socket.onAny((event, ...args) => {
    console.log({ event, args });
  }); */

  socket.on(
    "view channel",
    async (
      channel: { _id: string; title: string },
      user: { _id: string; username: string }
    ) => {
      console.log(
        `user '${user.username}' [${user._id}] joined channel '${channel.title}' [${channel._id}]`
      );
      await socket.join(channel._id);
    }
  );

  socket.on(
    "leave channel",
    async (
      channel: { _id: string; title: string },
      user: { _id: string; username: string }
    ) => {
      console.log(
        `user '${user.username}' [${user._id}] left channel '${channel.title}' [${channel._id}]`
      );
      await socket.leave(channel._id);
    }
  );

  /* socket.on('you started typing', async (
    channelId: string, userId: string, userName: string
  ) => {
    socket.to(channelId).emit('someone started typing', userId, userName)
  })

  socket.on('you stopped typing', async (
    channelId: string, userId: string
  ) => {
    socket.to(channelId).emit('someone stopped typing', userId)
  }) */
});

const port = process.env.PORT ?? 3000;
server.listen(port, () => {
  console.warn(`⚡️ server starting at http://localhost:${port}`);
});

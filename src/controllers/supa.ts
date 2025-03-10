import asyncHandler from "express-async-handler";
import { body } from "express-validator";
import { filetypemime } from "magic-bytes.js";

import * as supabase from "../../supabase/client";
import { exists as channelExists, isInChannel } from "./channel";
import { exists as userExists, authenticate } from "./user";
import { validate } from "../middleware/validate";
import path from "path";

function getNumberFromId(id: string) {
  return (parseInt(id.slice(-1), 16) % 5) + 1;
}

const uploadValidation = [
  body("upload").custom(async (_value, { req }) => {
    if (!req.file) throw new Error("Please upload a file.");
    if (req.file.size > 5242880) {
      throw new Error(
        "The uploaded image cannot be larger than 5 megabytes (5,242,880 bytes) in size."
      );
    }

    const mimetypes = filetypemime(req.file.buffer);
    if (
      !mimetypes.some((mimetype) =>
        [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/tiff",
        ].includes(mimetype)
      )
    )
      throw new Error(
        "The file must be of a valid image format: .jpeg, .png, .gif, .webp, or .tiff."
      );
  }),
  validate,
];

export const uploadChannelAvatar = [
  ...isInChannel,
  ...uploadValidation,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new Error("No file is present.");
    await supabase.upload(req.file, {
      channelId: req.thisChannel._id.toString(),
    });
    const { event } = await req.thisChannel.updateAvatar(req.user);
    if (req.io) {
      req.io.to(req.thisChannel._id.toString()).emit("channel avatar");
      req.io.to(req.thisChannel._id.toString()).emit("new event", event);
    }
    res.json({ event });
  }),
];

export const uploadUserAvatar = [
  ...authenticate,
  ...uploadValidation,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new Error("No file is present.");
    await supabase.upload(req.file!, {
      userId: req.user._id.toString(),
    });
    await req.user.toggleHasAvatar(true);
    res.sendStatus(200);
  }),
];

export const serveChannelAvatar = [
  channelExists,
  asyncHandler(async (req, res) => {
    const defaultAvatarPath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "camp.webp"
    );
    if (!req.thisChannel.hasAvatar) {
      res.sendFile(defaultAvatarPath);
      return;
    }

    const readable = await supabase.getReadable({
      channelId: req.thisChannel._id.toString(),
    });
    if (readable) {
      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "max-age=120");
      readable.pipe(res);
    } else {
      res.sendFile(defaultAvatarPath);
    }
  }),
];

export const serveUserAvatar = [
  userExists,
  asyncHandler(async (req, res) => {
    const defaultAvatarPath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      `user-${getNumberFromId(req.thisUser._id.toString())}.webp`
    );
    if (!req.thisUser.hasAvatar) {
      res.sendFile(defaultAvatarPath);
      return;
    }

    const readable = await supabase.getReadable({
      userId: req.thisUser._id.toString(),
    });
    if (readable) {
      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "max-age=120");
      readable.pipe(res);
    } else {
      res.sendFile(defaultAvatarPath);
    }
  }),
];

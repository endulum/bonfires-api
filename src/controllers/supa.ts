import asyncHandler from "express-async-handler";
import { body } from "express-validator";
import multer from "multer";
import { filetypemime } from "magic-bytes.js";

import * as supabase from "../../supabase/client";
import { isAdminOfChannel, isInChannel } from "./channel";
import { exists, authenticate } from "./user";
import { validate } from "../middleware/validate";
import path from "path";

const storage = multer.memoryStorage();
const uploadMulter = multer({ storage });

const uploadValidation = [
  uploadMulter.single("upload"),
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
  ...isAdminOfChannel,
  ...uploadValidation,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new Error("No file is present.");
    await supabase.upload(req.file, {
      channelId: req.thisChannel._id.toString(),
    });
    await req.thisChannel.toggleHasAvatar(true);
    res.sendStatus(200);
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
  ...isInChannel,
  asyncHandler(async (req, res) => {
    if (!req.thisChannel.hasAvatar) {
      res.sendFile(path.join(__dirname, "..", "..", "assets", "camp.webp"));
      return;
    }

    const readable = await supabase.getReadable({
      channelId: req.thisChannel._id.toString(),
    });
    if (readable) {
      res.set("Content-Type", "image/webp");
      readable.pipe(res);
    } else {
      res.sendFile(path.join(__dirname, "..", "..", "assets", "camp.webp"));
    }
  }),
];

export const serveUserAvatar = [
  ...authenticate,
  exists,
  asyncHandler(async (req, res) => {
    if (!req.thisUser.hasAvatar) {
      res.sendFile(path.join(__dirname, "..", "..", "assets", "user-1.webp"));
      return;
    }

    const readable = await supabase.getReadable({
      userId: req.thisUser._id.toString(),
    });
    if (readable) {
      res.set("Content-Type", "image/webp");
      readable.pipe(res);
    } else {
      res.sendFile(path.join(__dirname, "..", "..", "assets", "user-1.webp"));
    }
  }),
];

export const serveOwnAvatar = [
  ...authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user.hasAvatar) {
      res.sendFile(path.join(__dirname, "..", "..", "assets", "user-1.webp"));
      return;
    }

    const readable = await supabase.getReadable({
      userId: req.user._id.toString(),
    });
    if (readable) {
      res.set("Content-Type", "image/webp");
      readable.pipe(res);
    } else {
      res.sendFile(path.join(__dirname, "..", "..", "assets", "user-1.webp"));
    }
  }),
];

export const removeOwnAvatar = [
  ...authenticate,
  asyncHandler(async (req, res) => {
    if (req.user.hasAvatar) {
      await supabase.del({ userId: req.user._id.toString() });
      await req.user.toggleHasAvatar(false);
      res.sendStatus(200);
    } else {
      res.status(400).send("You have no avatar to remove.");
    }
  }),
];

export const removeChannelAvatar = [
  ...isAdminOfChannel,
  asyncHandler(async (req, res) => {
    if (req.thisChannel.hasAvatar) {
      await supabase.del({ channelId: req.thisChannel._id.toString() });
      await req.thisChannel.toggleHasAvatar(false);
      res.sendStatus(200);
    } else {
      res.status(400).send("This channel has no avatar to remove.");
    }
  }),
];

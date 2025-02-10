import asyncHandler from "express-async-handler";
import { body } from "express-validator";
import multer from "multer";
import { filetypemime } from "magic-bytes.js";

import * as supabase from "../../supabase/client";
import { isAdminOfChannel } from "./channel";
import { authenticate } from "./user";
import { validate } from "../middleware/validate";

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
    res.sendStatus(200);
  }),
];

export const uploadUserAvatar = [
  ...authenticate,
  ...uploadValidation,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new Error("No file is present.");
    await supabase.upload(req.file!, {
      channelId: req.user._id.toString(),
    });
    res.sendStatus(200);
  }),
];

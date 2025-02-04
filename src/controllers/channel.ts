import asyncHandler from "express-async-handler";
import { body } from "express-validator";

import { validate } from "../middleware/validate";
import { Channel } from "../../mongoose/models/channel";

export const validation = [
  body("title")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Please enter a title.")
    .bail()
    .isLength({ min: 2, max: 32 })
    .withMessage("Channel title must be between 2 and 32 characters long.")
    .escape(),
];

export const create = [
  ...validation,
  validate,
  asyncHandler(async (req, res) => {
    const channel = await Channel.create({
      title: req.body.title,
      admin: req.user,
    });
    res.json({ id: channel._id });
  }),
];

export const exists = asyncHandler(async (req, res, next) => {
  const channel = await Channel.findOne()
    .byId(req.params.channel)
    .populate([
      { path: "admin", select: "id username status" },
      // todo: let "status" still be present and defined, just as an empty string.
      // same for default color.
      { path: "users", select: "id username status" },
    ]);
  if (!channel) res.status(404).send("Channel could not be found.");
  else {
    req.thisChannel = channel;
    next();
  }
});

export const get = [
  exists,
  asyncHandler(async (req, res) => {
    res.json(req.thisChannel);
  }),
];

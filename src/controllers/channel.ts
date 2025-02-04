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
      { path: "admin", select: "id username" },
      // todo: let "status" still be present and defined, just as an empty string.
      // same for default color.
      { path: "users", select: "id username" },
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

export const edit = [
  exists,
  ...validation,
  validate,
  asyncHandler(async (req, res) => {
    await req.thisChannel.updateTitle(req.body.title);
    res.sendStatus(200);
  }),
];

export const del = [
  exists,
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Please input the channel title.")
    .bail()
    .custom(async (value, { req }) => {
      if (value !== req.thisChannel.title) throw new Error("Incorrect title.");
      return true;
    }),
  validate,
  asyncHandler(async (req, res) => {
    await req.thisChannel.deleteOne();
    res.sendStatus(200);
  }),
];

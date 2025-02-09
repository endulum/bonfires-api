import asyncHandler from "express-async-handler";
import { body } from "express-validator";

import { validate } from "../middleware/validate";
import { Channel } from "../../mongoose/models/channel";
import * as user from "./user";

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
    res.json({ _id: channel._id });
  }),
];

export const exists = asyncHandler(async (req, res, next) => {
  const channel = await Channel.findOne()
    .byId(req.params.channel)
    .populate([
      { path: "admin", select: "id username" },
      { path: "users", select: "id username" },
    ]);
  if (!channel) res.status(404).send("Channel could not be found.");
  else {
    req.thisChannel = channel;
    next();
  }
});

export const isInChannel = [
  ...user.authenticate,
  exists,
  asyncHandler(async (req, res, next) => {
    if (req.thisChannel.isInChannel(req.user)) {
      req.thisChannelSettings = await req.thisChannel.getSettings(req.user);
      return next();
    } else res.status(403).send("You are not in this channel.");
  }),
];

export const isAdminOfChannel = [
  ...isInChannel,
  asyncHandler(async (req, res, next) => {
    if (req.thisChannel.isAdmin(req.user)) return next();
    else res.status(403).send("You are not the admin of this channel.");
  }),
];

export const get = [
  ...isInChannel,
  asyncHandler(async (req, res) => {
    res.json(
      await Channel.findOne()
        .withUsersAndSettings(req.thisChannel._id)
        .populate({ path: "admin", select: "id username" })
    );
  }),
];

export const edit = [
  ...isAdminOfChannel,
  ...validation,
  validate,
  asyncHandler(async (req, res) => {
    await req.thisChannel.updateTitle(req.body.title);
    res.sendStatus(200);
  }),
];

export const editSettings = [
  ...isInChannel,
  body("displayName")
    .trim()
    .optional({ values: "falsy" })
    .isLength({ min: 1, max: 32 })
    .withMessage("Display names cannot be longer than 32 characters.")
    .escape(),
  body("nameColor")
    .trim()
    .optional({ values: "falsy" })
    .isHexColor()
    .withMessage("Color must be a valid hex color, i.e. #FFFFFF"),
  body("invisible")
    .trim()
    .optional({ values: "undefined" })
    .isBoolean()
    .withMessage('Must be "true" or "false".'),
  validate,
  asyncHandler(async (req, res) => {
    await req.thisChannelSettings.update(req.body);
    res.sendStatus(200);
  }),
];

export const del = [
  ...isAdminOfChannel,
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

export const getMutual = [
  ...user.authenticate,
  user.exists,
  asyncHandler(async (req, res) => {
    const channels = await req.user.getMutualChannels(req.thisUser);
    res.json(channels);
  }),
];

export const leave = [
  ...user.authenticate,
  ...isInChannel,
  asyncHandler(async (req, res) => {
    if (req.user._id.toString() === req.thisChannel.admin._id.toString()) {
      if (req.thisChannel.users.length > 1) {
        res
          .status(403)
          .send(
            "You cannot leave a channel if you are its admin and there are other users in the channel. Please promote one of the other users of this channel to admin before leaving."
          );
      } else {
        await Channel.deleteOne({ _id: req.thisChannel._id });
        res.sendStatus(200);
      }
    } else {
      await req.thisChannel.kick([req.user]);
      res.sendStatus(200);
    }
  }),
];

export const invite = [
  ...isInChannel,
  user.exists,
  asyncHandler(async (req, res) => {
    if (req.thisChannel.isInChannel(req.thisUser))
      res.status(400).send("This user is already in this channel.");
    else {
      await req.thisChannel.invite([req.thisUser]);
      res.sendStatus(200);
    }
  }),
];

export const kick = [
  ...isAdminOfChannel,
  user.exists,
  asyncHandler(async (req, res) => {
    if (!req.thisChannel.isInChannel(req.thisUser))
      res.status(400).send("This user is not in this channel.");
    else {
      await req.thisChannel.kick([req.thisUser]);
      res.sendStatus(200);
    }
  }),
];

export const promote = [
  ...isAdminOfChannel,
  user.exists,
  asyncHandler(async (req, res) => {
    if (req.thisChannel.isAdmin(req.thisUser))
      res.status(400).send("You cannot promote yourself.");
    else if (!req.thisChannel.isInChannel(req.thisUser))
      res.status(400).send("This user is not in this channel.");
    else {
      await req.thisChannel.updateAdmin(req.thisUser);
      res.sendStatus(200);
    }
  }),
];

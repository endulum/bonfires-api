import asyncHandler from "express-async-handler";
import { body } from "express-validator";

import { validate } from "../middleware/validate";
import { Channel } from "../../mongoose/models/channel";
import * as user from "./user";
import { User } from "../../mongoose/models/user";
import { ChannelSettings } from "../../mongoose/models/channelSettings";

export const getAll = [
  ...user.authenticate,
  asyncHandler(async (req, res) => {
    const take = parseInt((req.query.take as string) ?? "", 10) || 15;
    const before = req.query.before;
    const title = req.query.title;

    const { channels, nextChannelTimestamp } =
      await Channel.getPaginatedForUser(req.user, take, title, before);

    res.json({
      channels,
      links: {
        nextPage: nextChannelTimestamp
          ? `/channels?before=${nextChannelTimestamp}&take=${take}${
              title && title !== "" ? `&title=${title}` : ""
            }`
          : null,
      },
    });
  }),
];

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
  ...user.authenticate,
  ...validation,
  validate,
  asyncHandler(async (req, res) => {
    const channel = await Channel.create({
      title: req.body.title,
      owner: req.user,
    });
    res.json({ _id: channel._id });
  }),
];

export const exists = asyncHandler(async (req, res, next) => {
  const channel = await Channel.findOne().byId(req.params.channel);
  if (!channel) res.status(404).send("Channel could not be found.");
  else {
    req.thisChannel = channel;
    return next();
  }
});

export const isInChannel = [
  ...user.authenticate,
  exists,
  asyncHandler(async (req, res, next) => {
    if (!req.thisChannel.isInChannel(req.user))
      res.status(403).send("You are not in this channel.");
    else {
      const channelSettings = await ChannelSettings.findOne({
        channel: req.thisChannel,
        user: req.user,
      });
      if (!channelSettings)
        throw new Error(
          `Could not find settings for channel ${req.thisChannel._id} and user ${req.user._id}`
        );
      req.thisChannelSettings = channelSettings;
      return next();
    }
  }),
];

export const isOwnerOfChannel = [
  ...isInChannel,
  asyncHandler(async (req, res, next) => {
    if (req.thisChannel.isOwner(req.user)) return next();
    else res.status(403).send("You are not the owner of this channel.");
  }),
];

export const get = [
  ...isInChannel,
  asyncHandler(async (req, res) => {
    res.json(await Channel.findOne().byIdFull(req.thisChannel._id));
  }),
];

export const edit = [
  ...isInChannel,
  ...validation,
  validate,
  asyncHandler(async (req, res) => {
    if (req.body.title) {
      const { event } = await req.thisChannel.updateTitle(
        req.body.title,
        req.user
      );
      if (req.io) {
        req.io
          .to(req.thisChannel._id.toString())
          .emit("channel title", req.body.title);
        req.io.to(req.thisChannel._id.toString()).emit("new event", event);
      }
      res.json({ event });
    } else res.sendStatus(200);
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

    const updatedUser = await req.thisChannel.getMemberWithSettings(
      req.user._id
    );
    if (req.io) {
      req.io
        .to(req.thisChannel._id.toString())
        .emit("user personalize", updatedUser);
    }
    res.json({ user: updatedUser });
  }),
];

export const del = [
  ...isOwnerOfChannel,
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
  ...isInChannel,
  asyncHandler(async (req, res) => {
    const { event, userId } = await req.thisChannel.kickOne(req.user);
    if (req.io) {
      req.io.to(req.thisChannel._id.toString()).emit("user leave", userId);
      req.io.to(req.thisChannel._id.toString()).emit("new event", event);
    }
    res.json({ event });
  }),
];

const userExistsForm = body("username")
  .trim()
  .notEmpty()
  .withMessage("Please input a username.")
  .bail()
  .custom(async (value, { req }) => {
    const user = await User.findOne()
      .byNameOrId(value)
      .select("-__v")
      .populate({
        path: "settings",
        select: "-_id -__v",
      });
    if (!user) throw new Error("User could not be found.");
    req.thisUser = user;
    return true;
  });

const useReqOrForm = asyncHandler(async (req, res, next) => {
  if (req.params.user) return user.exists(req, res, next);
  return userExistsForm(req, res, next);
});

export const invite = [
  ...isInChannel,
  useReqOrForm,
  validate,
  asyncHandler(async (req, res) => {
    if (req.thisChannel.isInChannel(req.thisUser))
      res.status(400).send("This user is already in this channel.");
    else {
      const { event, user } = await req.thisChannel.inviteOne(
        req.thisUser,
        req.user
      );
      if (req.io) {
        req.io.to(req.thisChannel._id.toString()).emit("user invite", user);
        req.io.to(req.thisChannel._id.toString()).emit("new event", event);
      }
      res.json({ event, user });
    }
  }),
];

export const kick = [
  ...isOwnerOfChannel,
  useReqOrForm,
  validate,
  asyncHandler(async (req, res) => {
    if (!req.thisChannel.isInChannel(req.thisUser))
      res.status(400).send("This user is not in this channel.");
    else {
      const { event, userId } = await req.thisChannel.kickOne(
        req.thisUser,
        req.user
      );
      if (req.io) {
        req.io.to(req.thisChannel._id.toString()).emit("user leave", userId);
        req.io.to(req.thisChannel._id.toString()).emit("new event", event);
      }
      res.json({ event });
    }
  }),
];

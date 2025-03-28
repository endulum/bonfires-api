import asyncHandler from "express-async-handler";
import { body } from "express-validator";

import { validate } from "../middleware/validate";
import { messageLimiter } from "../middleware/rateLimiter";
import { Message } from "../../mongoose/models/message";
import { Event } from "../../mongoose/models/event";
import * as channel from "./channel";

export const validation = body("content")
  .trim()
  .notEmpty()
  .withMessage("Please enter a message.")
  .bail()
  .isLength({ max: 1000 })
  .withMessage("Messages cannot be more than 1000 characters long.")
  .escape();

export const create = [
  ...messageLimiter,
  ...channel.isInChannel,
  validation,
  validate,
  asyncHandler(async (req, res) => {
    const { _id } = await Message.create({
      user: req.user,
      channel: req.thisChannel._id,
      content: req.body.content,
    });
    const message = await Message.findById(_id)
      .populate("user", "_id username")
      .select("-channel");
    if (req.io)
      req.io.to(req.thisChannel._id.toString()).emit("new event", message);
    res.json({ message });
  }),
];

export const getForChannel = [
  ...channel.isInChannel,
  asyncHandler(async (req, res) => {
    const take = parseInt((req.query.take as string) ?? "", 10) || 30;
    const before = req.query.before;

    const { messages, nextMessageTimestamp } =
      await Message.getPaginatedForChannel(req.thisChannel, take, before);

    const events =
      messages.length > 0
        ? await Event.getForChannel(
            req.thisChannel,
            // beginning timestamp is the latest message
            // but if that message is the latest ever in this channel
            // then it'll be the general end of time
            before ? messages[0].timestamp : undefined,
            // ending timestamp is the earliest message
            // but if that message is the earliest ever in this channel
            // then it'll be the general beginning of time
            nextMessageTimestamp
              ? messages[messages.length - 1].timestamp
              : undefined
          )
        : // and if there are no messages to get timestamps from,
          // then just get all events from beginning to end of time
          await Event.getForChannel(req.thisChannel);

    res.json({
      messages,
      events,
      links: {
        nextPage: nextMessageTimestamp
          ? `/channel/${req.thisChannel._id}/messages?before=${nextMessageTimestamp}&take=${take}`
          : null,
      },
    });
  }),
];

export const getPinned = [
  ...channel.isInChannel,
  asyncHandler(async (req, res) => {
    const pinned = await Message.getPinnedForChannel(req.thisChannel);
    res.json({
      pinned,
    });
  }),
];

const exists = asyncHandler(async (req, res, next) => {
  const message = await Message.findOne().byId(req.params.message);
  if (message) {
    req.thisMessage = message;
    return next();
  }
  res.status(404).send("Message not found.");
});

export const get = [
  ...channel.isInChannel,
  exists,
  asyncHandler(async (req, res) => {
    res.json({
      message: await Message.findOne().byIdFull(req.thisMessage._id),
    });
  }),
];

export const pin = [
  ...channel.isInChannel,
  exists,
  body("pin").trim().isBoolean().escape(),
  asyncHandler(async (req, res) => {
    const pinnedCount = (await Message.getPinnedForChannel(req.thisChannel))
      .length;
    if (req.body.pin === "true" && pinnedCount >= 20) {
      res
        .status(400)
        .send(
          "Channels have a pin limit of 20. Unpin a message if you would like to pin this one."
        );
    } else if (req.body.pin === "true" && req.thisMessage.pinned === true) {
      res.status(400).send("This message is already pinned.");
    } else if (req.body.pin === "false" && req.thisMessage.pinned === false)
      res.status(400).send("This message was never pinned.");
    else {
      const event = await req.thisMessage.pin(
        req.body.pin === "true",
        req.user
      );
      if (req.io) {
        if (event)
          req.io.to(req.thisChannel._id.toString()).emit("new event", event);
        req.io
          .to(req.thisChannel._id.toString())
          .emit(
            "message pin",
            await Message.findOne().byIdFull(req.thisMessage._id),
            req.body.pin === "true"
          );
      }
      res.sendStatus(200);
    }
  }),
];

const isYours = [
  ...channel.isInChannel,
  exists,
  asyncHandler(async (req, res, next) => {
    if (req.thisMessage.belongsTo(req.user._id)) return next();
    res.status(403).send("This message does not belong to you.");
  }),
];

const isYoursOrOwner = [
  ...channel.isInChannel,
  exists,
  asyncHandler(async (req, res, next) => {
    if (
      req.thisMessage.belongsTo(req.user._id) ||
      req.thisChannel.isOwner(req.user)
    )
      return next();
    res
      .status(403)
      .send(
        "Only the message sender or channel owner can perform this action."
      );
  }),
];

export const edit = [
  ...isYours,
  validation,
  validate,
  asyncHandler(async (req, res) => {
    await req.thisMessage.edit(req.body.content);
    const editedMessage = await Message.findOne().byIdFull(req.thisMessage._id);
    if (req.io)
      req.io
        .to(req.thisChannel._id.toString())
        .emit("message edit", editedMessage);
    res.json({
      message: editedMessage,
    });
  }),
];

export const del = [
  ...isYoursOrOwner,
  asyncHandler(async (req, res) => {
    await Message.deleteOne({ _id: req.thisMessage._id });
    if (req.io)
      req.io
        .to(req.thisChannel._id.toString())
        .emit("message delete", req.thisMessage._id);
    res.sendStatus(200);
  }),
];

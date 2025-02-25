import asyncHandler from "express-async-handler";
import { body } from "express-validator";

import { validate } from "../middleware/validate";
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
    res.json(message);
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
      await req.thisMessage.pin(req.body.pin === "true", req.user);
      res.sendStatus(200);
    }
  }),
];

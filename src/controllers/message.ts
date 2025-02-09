import asyncHandler from "express-async-handler";
import { body } from "express-validator";

import { validate } from "../middleware/validate";
import { Message } from "../../mongoose/models/message";
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
    const message = await Message.create({
      user: req.user,
      channel: req.thisChannel,
      content: req.body.content,
    });
    res.json(message);
  }),
];

export const getForChannel = [
  ...channel.isInChannel,
  asyncHandler(async (req, res) => {
    const take = parseInt((req.query.take as string) ?? "", 10) || 30;
    const before = req.query.before;

    const { messages, nextMessageTimestamp } = await Message.getPaginated(
      req.thisChannel,
      take,
      before
    );

    res.json({
      messages,
      links: {
        nextPage: nextMessageTimestamp
          ? `/channel/${req.thisChannel._id}/messages?before=${nextMessageTimestamp}&take=${take}`
          : null,
      },
    });
  }),
];

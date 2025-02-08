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
    const take = 5;
    const { before } = req.query as Record<string, string | undefined>;
    const messages = await Message.find({
      channel: req.thisChannel,
      ...(before && {
        timestamp: {
          $lte: before,
        },
      }),
    })
      .limit(take + 1)
      .sort("-timestamp -_id")
      .select("-channel");

    res.json({
      messages: messages.slice(0, take),
      links: {
        nextPage:
          messages.length > take
            ? `/channel/${req.thisChannel._id}/messages?before=${messages[
                messages.length - 1
              ].timestamp?.getTime()}`
            : null,
      },
    });
  }),
];

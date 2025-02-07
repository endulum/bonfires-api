import asyncHandler from "express-async-handler";
import { body } from "express-validator";

import { validate } from "../middleware/validate";
import { Channel } from "../../mongoose/models/channel";
import { Message } from "../../mongoose/models/message";
import * as user from "./user";
import * as channel from "./channel";
import { ChannelSettings } from "../../mongoose/models/channelSettings";

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
    const messages = await Message.find({
      channel: req.thisChannel,
    })
      .limit(5)
      .sort("-timestamp -_id");
    res.json(messages);
  }),
];

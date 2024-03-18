import { type RequestHandler } from 'express'
import asyncHandler from 'express-async-handler'
import { type ValidationChain, body } from 'express-validator'
import { sendErrorsIfAny } from './helpers'
import Message from '../models/message'
import type { IUserDocument } from '../models/user'

const messageController: Record<string, RequestHandler | Array<RequestHandler | ValidationChain>> = {}

messageController.newMessage = [
  body('content')
    .trim()
    .isLength({ min: 1 }).withMessage('Please enter a message.').bail()
    .isLength({ max: 512 }).withMessage('Messages cannot be more than 512 characters long.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    await Message.create({
      channel: req.requestedChannel.id,
      user: req.authenticatedUser.id,
      content: req.body.content
    })
    res.sendStatus(200)
  })
]

messageController.getMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({ channel: req.requestedChannel })
    .populate({ path: 'user', model: 'User' }).exec()
  res.status(200).json(messages.map(message => ({
    id: message.id,
    content: message.content,
    user: {
      username: (message.user as IUserDocument).username,
      id: (message.user as IUserDocument).id,
      displayName:
        (message.user as IUserDocument).getDisplayName(req.requestedChannel) ??
        (message.user as IUserDocument).username
    },
    timestamp: message.timestamp,
    isRemoved: message.isRemoved
  })))
})

export default messageController
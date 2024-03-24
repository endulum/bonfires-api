import { type RequestHandler } from 'express'
import asyncHandler from 'express-async-handler'
import { type ValidationChain, body } from 'express-validator'
import { sendErrorsIfAny } from './helpers'
import Message from '../models/message'

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
      channel: req.channel.id,
      user: req.authUser.id,
      content: req.body.content
    })
    res.sendStatus(200)
  })
]

messageController.getMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({ channel: req.channel })
    .populate({ path: 'user', model: 'User' }).exec()
  res.status(200).json(messages.map(message => ('username' in message.user && {
    id: message.id,
    timestamp: message.timestamp,
    content: message.content,
    user: {
      username: message.user.username,
      id: message.user.id,
      displayName: message.user.getDisplayName(req.channel),
      isInChannel: req.channel.users.find((user) => {
        return user.id.toString() === message.user.id.toString()
      }) !== undefined,
      isAdmin: req.channel.admin.id.toString() === message.user.id.toString()
    },
    isRemoved: message.isRemoved
  })))
})

export default messageController

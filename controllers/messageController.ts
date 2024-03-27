import { type RequestHandler } from 'express'
import asyncHandler from 'express-async-handler'
import { type ValidationChain, body } from 'express-validator'
import { sendErrorsIfAny } from './helpers'
import Message, { type IMessageDocument } from '../models/message'
import { type IChannelDocument } from '../models/channel'

const messageController: Record<string, RequestHandler | Array<RequestHandler | ValidationChain>> = {}

const messageInfo = (message: IMessageDocument, channel: IChannelDocument): {
  id: string
  content: string
  user: {
    username: string
    id: string
    displayName: string | null
    isAdmin: boolean
    isInChannel: boolean
  }
  timestamp: Date
} | null => {
  return 'username' in message.user
    ? {
        id: message.id.toString(),
        timestamp: message.timestamp,
        content: message.content,
        user: {
          username: message.user.username,
          id: message.user.id.toString(),
          displayName: message.user.getDisplayName(channel),
          isInChannel: channel.users.find((user) => {
            return user.id.toString() === message.user.id.toString()
          }) !== undefined,
          isAdmin: channel.admin.id.toString() === message.user.id.toString()
        }
      }
    : null
}

messageController.newMessage = [
  body('content')
    .trim()
    .isLength({ min: 1 }).withMessage('Please enter a message.').bail()
    .isLength({ max: 512 }).withMessage('Messages cannot be more than 512 characters long.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    let message = await Message.create({
      channel: req.channel.id,
      user: req.authUser.id,
      content: req.body.content
    })
    message = await message.populate({ path: 'user', model: 'User' })
    req.io
      .to(req.channel.id.toString() as string)
      .emit('new message created', messageInfo(message, req.channel))
    res.sendStatus(200)
  })
]

messageController.getMessages = asyncHandler(async (req, res, next) => {
  const messages: IMessageDocument[] = await Message.find({ channel: req.channel.id })
    .populate({ path: 'user', model: 'User' }).exec()
  res.status(200).json(messages.map(message => (
    messageInfo(message, req.channel)
  )))
})

export default messageController

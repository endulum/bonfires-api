import { type RequestHandler, type Request } from 'express'
import asyncHandler from 'express-async-handler'
import { type ValidationChain, body } from 'express-validator'
import { sendErrorsIfAny } from './helpers'
import User from '../models/user'
import Channel from '../models/channel'

const channelController: Record<string, RequestHandler | Array<RequestHandler | ValidationChain>> = {}

channelController.doesChannelExist = asyncHandler(async (req, res, next) => {
  let channel = null
  try {
    channel = await Channel.findById(req.params.channel)
  } catch (e) {}
  if (channel === null) res.status(404).send('Channel not found.')
  else {
    req.requestedChannel = channel
    next()
  }
})

channelController.areYouInThisChannel = asyncHandler(async (req, res, next) => {
  if (!req.requestedChannel.users.includes(req.authenticatedUser.id)) {
    res.status(403).send('You are not a member of this channel.')
  } else next()
})

channelController.getChannel = asyncHandler(async (req, res, next) => {
  const admin = await User.findById(req.requestedChannel.admin)
  const users = await Promise.all(req.requestedChannel.users.map(async (id) => {
    const user = await User.findById(id)
    return user
  }))
  res.status(200).json({
    title: req.requestedChannel.title,
    admin: {
      username: admin?.username,
      id: admin?.id
    },
    users: users.map(user => ({
      username: user?.username, id: user?.id
    }))
  })
})

channelController.createChannel = [
  body('title')
    .trim()
    .isLength({ min: 1 }).withMessage('Please enter a title.').bail()
    .isLength({ min: 2, max: 32 }).withMessage('Channel title must be between 2 and 32 characters long.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    await Channel.create({
      title: req.body.title,
      admin: req.authenticatedUser,
      users: [req.authenticatedUser]
    })
    res.sendStatus(200)
  })
]

channelController.inviteToChannel = [
  body('username')
    .trim()
    .isLength({ min: 1 }).withMessage('Please enter a username.').bail()
    .custom(async (value: string, meta) => {
      const req = meta.req as unknown as Request
      const existingUser = await User.findByNameOrId(value)
      if (existingUser !== null) {
        req.existingUser = existingUser
        return true
      } return await Promise.reject(new Error())
    }).withMessage('No user with this username exists.').bail()
    .custom(async (value: string, meta) => {
      const req = meta.req as unknown as Request
      if (req.requestedChannel.users.includes(req.existingUser.id)) {
        return await Promise.reject(new Error())
      } return true
    }).withMessage('This user is already in this channel.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    req.requestedChannel.users.push(req.existingUser.id)
    await req.requestedChannel.save()
    res.sendStatus(200)
  })
]

export default channelController

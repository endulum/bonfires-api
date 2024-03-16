import { type RequestHandler, type Request } from 'express'
import asyncHandler from 'express-async-handler'
import { type ValidationChain, body } from 'express-validator'
import { sendErrorsIfAny } from './helpers'
import User from '../models/user'
import Channel from '../models/channel'

const channelController: Record<string, RequestHandler | Array<RequestHandler | ValidationChain>> = {}

channelController.doesChannelExist = asyncHandler(async (req, res, next) => {
  let channel = null
  try { channel = await Channel.findById(req.params.channel) } catch (e) {}
  if (channel === null) res.status(404).send('Channel not found.')
  else {
    req.requestedChannel = channel
    next()
  }
})

channelController.areYouInThisChannel = asyncHandler(async (req, res, next) => {
  const isInChannel = await req.requestedChannel.isInChannel(req.authenticatedUser)
  if (!isInChannel) {
    res.status(403).send('You are not a member of this channel.')
  } else next()
})

channelController.areYouChannelAdmin = asyncHandler(async (req, res, next) => {
  const isAdminOfChannel = await req.requestedChannel.isAdminOfChannel(req.authenticatedUser)
  if (!isAdminOfChannel) {
    res.status(403).send('You are not the admin of this channel.')
  } else next()
})

channelController.getChannel = asyncHandler(async (req, res, next) => {
  const admin = await User.findById(req.requestedChannel.admin)
  const users = await Promise.all(req.requestedChannel.users.map(async (userId) => {
    return await User.findById(userId)
  }))
  res.status(200).json({
    title: req.requestedChannel.title,
    admin: {
      username: admin?.username,
      id: admin?.id
    },
    users: users.map(user => ({
      username: user?.username,
      id: user?.id
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
      const isInChannel = await req.requestedChannel.isInChannel(req.existingUser)
      return isInChannel ? await Promise.reject(new Error()) : true
    }).withMessage('This user is already in this channel.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    await req.requestedChannel.inviteToChannel(req.existingUser)
    res.sendStatus(200)
  })
]

channelController.leaveChannel = asyncHandler(async (req, res, next) => {
  const isAdmin = await req.requestedChannel.isAdminOfChannel(req.authenticatedUser)
  if (isAdmin && req.requestedChannel.users.length > 1) {
    res.status(403).send('You cannot leave a channel if you are its admin and there are other users in the channel. Please promote one of the other users of this channel to admin before leaving.')
  } else {
    await req.requestedChannel.removeFromChannel(req.authenticatedUser)
    if (req.requestedChannel.users.length === 0) {
      await Channel.findByIdAndDelete(req.requestedChannel.id)
    }
    res.sendStatus(200)
  }
})

channelController.editChannel = [
  body('title')
    .trim()
    .isLength({ min: 1 }).withMessage('Please enter a channel title.')
    .bail()
    .isLength({ max: 64 })
    .withMessage('Channel titles cannot be more than 64 characters long.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    req.requestedChannel.title = req.body.title
    await req.requestedChannel.save()
    res.sendStatus(200)
  })
]

const userActionValidation = body('username')
  .trim()
  .isLength({ min: 1 }).withMessage('Please enter a username.').bail()
  .custom(async (value: string, meta) => {
    const req = meta.req as unknown as Request
    const existingUser = await User.findByNameOrId(value)
    const isUserInChannel = await req.requestedChannel.isInChannel(existingUser)
    if (isUserInChannel) {
      req.existingUser = existingUser
      return true
    } return await Promise.reject(new Error())
  }).withMessage('No user with this username is in this channel.').bail()
  .custom(async (value: string, meta) => {
    const req = meta.req as unknown as Request
    return (
      req.existingUser.id.toString() === req.authenticatedUser.id.toString()
    )
      ? await Promise.reject(new Error())
      : true
  }).withMessage('You cannot perform this action on yourself.')
  .escape()

channelController.kickUserFromChannel = [
  userActionValidation,
  sendErrorsIfAny,
  asyncHandler(async (req, res, next) => {
    await req.requestedChannel.removeFromChannel(req.existingUser)
    res.sendStatus(200)
  })
]

channelController.promoteUser = [
  userActionValidation,
  sendErrorsIfAny,
  asyncHandler(async (req, res, next) => {
    await req.requestedChannel.promoteToAdmin(req.existingUser)
    res.sendStatus(200)
  })
]

export default channelController

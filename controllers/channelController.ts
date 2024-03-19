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
      .populate({ path: 'admin', model: 'User' })
      .populate({ path: 'users', model: 'User' })
      .exec()
  } catch (e) {}
  if (channel === null) res.status(404).send('Channel not found.')
  else {
    req.channel = channel
    next()
  }
})

channelController.areYouInThisChannel = asyncHandler(async (req, res, next) => {
  const isInChannel = await req.channel.isInChannel(req.authUser)
  if (!isInChannel) {
    res.status(403).send('You are not a member of this channel.')
  } else next()
})

channelController.areYouChannelAdmin = asyncHandler(async (req, res, next) => {
  const isAdminOfChannel = await req.channel.isAdminOfChannel(req.authUser)
  if (!isAdminOfChannel) {
    res.status(403).send('You are not the admin of this channel.')
  } else next()
})

channelController.getOwnChannels = asyncHandler(async (req, res, next) => {
  const ownChannels = await Channel.find({
    users: {
      $in: [req.authUser.id]
    }
  })
  res.status(200).json(ownChannels.map(channel => ({
    id: channel.id,
    title: channel.title,
    admin: channel.admin,
    userCount: channel.users.length,
    ownDisplayName: req.authUser.getDisplayName(channel)
  })))
})

channelController.getChannel = asyncHandler(async (req, res, next) => {
  res.status(200).json('username' in req.channel.admin && {
    title: req.channel.title,
    admin: {
      username: req.channel.admin.username,
      id: req.channel.admin.id,
      displayName: req.channel.admin.getDisplayName(req.channel) ??
          req.channel.admin.username
    },
    users: req.channel.users.map(user =>
      'username' in user && {
        username: user.username,
        id: user.id,
        displayName: user.getDisplayName(req.channel) ?? user.username
      }
    )
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
      admin: req.authUser,
      users: [req.authUser]
    })
    res.sendStatus(200)
  })
]

channelController.inviteToChannel = [
  body('username')
    .trim()
    .isLength({ min: 1 }).withMessage('Please enter a username.').bail()
    .custom(async (value: string, meta) => {
      const req = meta.req as Request
      const existingUser = await User.findByNameOrId(value)
      if (existingUser !== null) {
        req.existingUser = existingUser
        return true
      } return await Promise.reject(new Error())
    }).withMessage('No user with this username exists.').bail()
    .custom(async (value: string, meta) => {
      const req = meta.req as Request
      const isInChannel = await req.channel.isInChannel(req.existingUser)
      return isInChannel ? await Promise.reject(new Error()) : true
    }).withMessage('This user is already in this channel.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    await req.channel.inviteToChannel(req.existingUser)
    res.sendStatus(200)
  })
]

channelController.editDisplayName = [
  body('displayName')
    .trim()
    .isLength({ max: 64 }).withMessage('Display names cannot be more than 64 characters long.')
    .escape(),

  sendErrorsIfAny,

  asyncHandler(async (req, res, next) => {
    await req.authUser.changeDisplayName(
      req.channel,
      (req.body.displayName as string)
    )
    res.sendStatus(200)
  })
]

channelController.leaveChannel = asyncHandler(async (req, res, next) => {
  const isAdmin = await req.channel.isAdminOfChannel(req.authUser)
  if (isAdmin && req.channel.users.length > 1) {
    res.status(403).send('You cannot leave a channel if you are its admin and there are other users in the channel. Please promote one of the other users of this channel to admin before leaving.')
  } else {
    await req.channel.removeFromChannel(req.authUser)
    if (req.channel.users.length === 0) {
      await Channel.findByIdAndDelete(req.channel.id)
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
    req.channel.title = req.body.title
    await req.channel.save()
    res.sendStatus(200)
  })
]

const userActionValidation = body('username')
  .trim()
  .isLength({ min: 1 }).withMessage('Please enter a username.').bail()
  .custom(async (value: string, meta) => {
    const req = meta.req as Request
    const existingUser = await User.findByNameOrId(value)
    const isUserInChannel = await req.channel.isInChannel(existingUser)
    if (isUserInChannel) {
      req.existingUser = existingUser
      return true
    } return await Promise.reject(new Error())
  }).withMessage('No user with this username is in this channel.').bail()
  .custom(async (value: string, meta) => {
    const req = meta.req as Request
    return (
      req.existingUser.id.toString() === req.authUser.id.toString()
    )
      ? await Promise.reject(new Error())
      : true
  }).withMessage('You cannot perform this action on yourself.')
  .escape()

channelController.kickUserFromChannel = [
  userActionValidation,
  sendErrorsIfAny,
  asyncHandler(async (req, res, next) => {
    await req.channel.removeFromChannel(req.existingUser)
    res.sendStatus(200)
  })
]

channelController.promoteUser = [
  userActionValidation,
  sendErrorsIfAny,
  asyncHandler(async (req, res, next) => {
    await req.channel.promoteToAdmin(req.existingUser)
    res.sendStatus(200)
  })
]

export default channelController

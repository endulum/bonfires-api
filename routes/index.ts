import express, { type RequestHandler } from 'express'
import { type ValidationChain } from 'express-validator'
import asyncHandler from 'express-async-handler'
import userController from '../controllers/userController'
import channelController from '../controllers/channelController'
import messageController from '../controllers/messageController'

const router = express.Router()

const areYouThisUser:
Array<RequestHandler | Array<RequestHandler | ValidationChain>> = [
  userController.authenticate,
  userController.doesUserExist,
  userController.areYouThisUser
]

const areYouInThisChannel:
Array<RequestHandler | Array<RequestHandler | ValidationChain>> = [
  userController.authenticate,
  channelController.doesChannelExist,
  channelController.areYouInThisChannel
]

const areYouChannelAdmin:
Array<RequestHandler | Array<RequestHandler | ValidationChain>> = [
  userController.authenticate,
  channelController.doesChannelExist,
  channelController.areYouChannelAdmin
]

router.route('/signup')
  .post(userController.signUp)

router.route('/login')
  .post(userController.logIn)
  .get(userController.authenticate, asyncHandler(async (req, res, next) => {
    res.status(200).json({
      username: req.authUser.username,
      id: req.authUser.id
    })
  }))

router.route('/user/:user')
  .get(userController.authenticate, userController.doesUserExist, userController.getUser)
  .put(...areYouThisUser, userController.editUser)

router.route('/channels')
  .get(userController.authenticate, channelController.getOwnChannels)
  .post(userController.authenticate, channelController.createChannel)

router.route('/channel/:channel')
  .get(...areYouInThisChannel, channelController.getChannel)
  .put(...areYouChannelAdmin, channelController.editChannel)
  .delete(...areYouInThisChannel, channelController.leaveChannel)

router.route('/channel/:channel/invite')
  .post(...areYouInThisChannel, channelController.inviteToChannel)

router.route('/channel/:channel/name')
  .post(...areYouInThisChannel, channelController.editDisplayName)

router.route('/channel/:channel/kick')
  .post(...areYouChannelAdmin, channelController.kickUserFromChannel)

router.route('/channel/:channel/promote')
  .post(...areYouChannelAdmin, channelController.promoteUser)

router.route('/channel/:channel/messages')
  .get(...areYouInThisChannel, messageController.getMessages)
  .post(...areYouInThisChannel, messageController.newMessage)

export default router

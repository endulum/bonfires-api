import express from 'express'
import asyncHandler from 'express-async-handler'
import userController from '../controllers/userController'
import channelController from '../controllers/channelController'
import messageController from '../controllers/messageController'

const router = express.Router()

router.route('/signup')
  .post(userController.signUp)

router.route('/login')
  .post(userController.logIn)
  .get(userController.authenticate, asyncHandler(async (req, res, next) => {
    res.status(200).json({
      username: req.authenticatedUser.username,
      id: req.authenticatedUser.id
    })
  }))

router.route('/user/:user')
  .get(
    userController.authenticate,
    userController.doesUserExist,
    userController.getUser
  )
  .put(
    userController.authenticate,
    userController.doesUserExist,
    userController.areYouThisUser,
    userController.editUser
  )

router.route('/channels')
  .post(
    userController.authenticate,
    channelController.createChannel
  )

router.route('/channel/:channel')
  .get(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouInThisChannel,
    channelController.getChannel
  )
  .put(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouChannelAdmin,
    channelController.editChannel
  )
  .delete(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouInThisChannel,
    channelController.leaveChannel
  )

router.route('/channel/:channel/invite')
  .post(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouInThisChannel,
    channelController.inviteToChannel
  )

router.route('/channel/:channel/name')
  .post(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouInThisChannel,
    channelController.editDisplayName
  )

router.route('/channel/:channel/kick')
  .post(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouChannelAdmin,
    channelController.kickUserFromChannel
  )

router.route('/channel/:channel/promote')
  .post(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouChannelAdmin,
    channelController.promoteUser
  )

router.route('/channel/:channel/messages')
  .get(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouInThisChannel,
    messageController.getMessages
  )
  .post(
    userController.authenticate,
    channelController.doesChannelExist,
    channelController.areYouInThisChannel,
    messageController.newMessage
  )

export default router

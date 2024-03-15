import express from 'express'
import asyncHandler from 'express-async-handler'
import userController from '../controllers/userController'
import channelController from '../controllers/channelController'

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

export default router

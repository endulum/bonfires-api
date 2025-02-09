import express from "express";

import * as auth from "./controllers/auth";
import * as user from "./controllers/user";
import * as channel from "./controllers/channel";
import * as message from "./controllers/message";

const router = express.Router();

// auth
router.route("/login").post(user.deserialize, auth.login);
router.route("/signup").post(user.deserialize, auth.signup);
router.route("/github").get(auth.github);

// user
router.route("/me").get(user.me).put(user.edit);
router.route("/user/:user").get(user.get);
router.route("/user/:user/mutual").get(channel.getMutual);

// channel
router.route("/channels").get(channel.getAll).post(channel.create);
router
  .route("/channel/:channel")
  .get(channel.get)
  .put(channel.edit)
  .delete(channel.del);
router.route("/channel/:channel/leave").post(channel.leave);
router.route("/channel/:channel/invite/:user").post(channel.invite);
router.route("/channel/:channel/kick/:user").post(channel.kick);
router.route("/channel/:channel/promote/:user").post(channel.promote);
router.route("/channel/:channel/settings").put(channel.editSettings);

// message
router
  .route("/channel/:channel/messages")
  .get(message.getForChannel)
  .post(message.create);

export { router };

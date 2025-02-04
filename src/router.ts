import express from "express";

import * as auth from "./controllers/auth";
import * as user from "./controllers/user";
import * as channel from "./controllers/channel";

const router = express.Router();

// auth
router.route("/login").post(user.deserialize, auth.login);
router.route("/signup").post(user.deserialize, auth.signup);
router.route("/github").get(auth.github);

// user
router.route("/me").get(user.me).put(user.edit);
router.route("/user/:user").get(user.get);

// channel
router.route("/channels").post(user.authenticate, channel.create);
router
  .route("/channel/:channel")
  .get(channel.get)
  .put(channel.edit)
  .delete(channel.del);

export { router };

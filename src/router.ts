import express from "express";

import * as auth from "./controllers/auth";
import * as user from "./controllers/user";

const router = express.Router();

// auth
router.route("/login").post(user.deserialize, auth.login);
router.route("/signup").post(user.deserialize, auth.signup);
router.route("/github").get(auth.github);

// user
router.route("/me").get(user.me).put(user.edit);
router.route("/user/:user").get(user.get);

export { router };

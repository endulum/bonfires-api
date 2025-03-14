import asyncHandler from "express-async-handler";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { ofetch } from "ofetch";
import { parse } from "querystring";
import { Types, isValidObjectId } from "mongoose";

import { validate } from "../middleware/validate";
import {
  loginLimiter,
  signupLimiter,
  registerLimiter,
} from "../middleware/rateLimiter";
import { User } from "../../mongoose/models/user";

// is imported at user controller for username changing
export const usernameValidation = body("username")
  .trim()
  .notEmpty()
  .withMessage("Please enter a username.")
  .bail()
  .isLength({ min: 2, max: 32 })
  .withMessage("Usernames must be between 2 and 32 characters long.")
  .matches(/^[a-z0-9-]+$/g)
  .withMessage(
    "Username must only consist of lowercase letters, numbers, and hyphens."
  )
  .custom(async (value, { req }) => {
    if (isValidObjectId(value))
      throw new Error("Usernames cannot be MongoIDs.");
    const existingUser = await User.findOne({ username: value });
    if (
      existingUser &&
      !(
        "user" in req && existingUser._id.toString() === req.user._id.toString()
      )
    ) {
      throw new Error(
        "A user with this username already exists. Usernames must be unique."
      );
    }
  })
  .escape();

const isNotLoggedIn = asyncHandler(async (req, res, next) => {
  if (!req.user) next();
  else res.status(403).send("You cannot perform this action when logged in.");
});

export const signup = [
  ...signupLimiter,
  isNotLoggedIn,
  usernameValidation,
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Please enter a password.")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .escape(),
  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Please confirm your password.")
    .bail()
    .custom(async (value, { req }) => {
      if (req.body.password !== "" && value !== req.body.password) {
        throw new Error("Both passwords do not match.");
      }
    })
    .escape(),
  validate,
  ...registerLimiter,
  asyncHandler(async (req, res) => {
    await User.create({
      username: req.body.username,
      password: req.body.password,
    });
    res.sendStatus(200);
  }),
];

const signToken = async (id: Types.ObjectId, username: string) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT secret is not defined.");
  const token = jwt.sign({ username, id }, process.env.JWT_SECRET);
  return token;
};

export const login = [
  ...loginLimiter,
  isNotLoggedIn,
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Please enter a username.")
    .escape(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Please enter a password.")
    .bail()
    .custom(async (value, { req }) => {
      if (!req.body.username) return;
      const user = await User.findOne({ username: req.body.username });
      if (!user) throw new Error("Incorrect username or password.");
      const match = await user.comparePassword(value);
      if (!match) throw new Error("Incorrect username or password.");
      req.user = user;
    })
    .escape(),
  validate,
  asyncHandler(async (req, res) => {
    res.json({
      token: await signToken(req.user._id, req.user.username),
    });
  }),
];

const exchangeCodeForToken = async (code: string) => {
  const { access_token } = await ofetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "get",
      params: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_SECRET,
        redirect_uri: `${process.env.FRONTEND_URL}/github`,
        code,
      },
      parseResponse: (response) => parse(response),
    }
  );
  return access_token;
};

const fetchGithubUser = async (accessToken: string) => {
  const data = await ofetch("https://api.github.com/user", {
    method: "get",
    headers: {
      Authorization: `token ${accessToken}`,
    },
  });
  return data;
};

export const github = [
  isNotLoggedIn,
  asyncHandler(async (req, res) => {
    const { code } = req.query as Record<string, string | null>;
    if (!code || code === "undefined") {
      res.status(400).send("No code is provided.");
      return;
    }
    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await fetchGithubUser(accessToken);

    let username = "";
    let id: Types.ObjectId | null = null;
    const existingUser = await User.findOne({ ghId: githubUser.id });
    if (existingUser) {
      username = existingUser.username;
      id = existingUser._id;
      await existingUser.updateGitHubUser(githubUser.login);
    } else {
      const newUser = await User.create({
        username: githubUser.login,
        ghId: githubUser.id,
        ghUser: githubUser.login,
      });
      username = githubUser.login;
      id = newUser._id;
      if (process.env.NODE_ENV !== "test") {
        const module = await import("../../supabase/client");
        if (id) {
          await module.uploadFromUrl(githubUser.avatar_url, id.toString());
          /* await newUser.toggleHasAvatar(true); */
        }
      }
    }

    if (id !== null)
      res.json({
        token: await signToken(id, username),
      });
  }),
];

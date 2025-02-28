import asyncHandler from "express-async-handler";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { usernameValidation } from "./auth";
import { validate } from "../middleware/validate";
import { User } from "../../mongoose/models/user";

export const deserialize = asyncHandler(async (req, _res, next) => {
  const bearerHeader = req.headers.authorization;
  const bearerToken = bearerHeader?.split(" ")[1];
  if (bearerToken === undefined || bearerToken === "undefined") return next();

  try {
    if (!process.env.JWT_SECRET) throw new Error("Secret is not defined.");
    const { id } = jwt.verify(bearerToken, process.env.JWT_SECRET) as {
      id: Types.ObjectId;
    };
    const user = await User.findById(id).select("-__v").populate({
      path: "settings",
      select: "-_id -__v",
    });
    if (user) req.user = user;
  } catch (err) {
    console.error(err);
  }
  return next();
});

export const authenticate = [
  deserialize,
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401).send("Please log in.");
    } else {
      next();
    }
  }),
];

export const edit = [
  ...authenticate,
  usernameValidation,
  body("status")
    .trim()
    .isLength({ max: 200 })
    .withMessage("Statuses cannot be more than 200 characters long.")
    .escape(),
  body("password")
    .trim()
    .custom(async (value, { req }) => {
      if (value.length > 0 && req.user.githubId)
        throw new Error(
          "This account was authenticated with GitHub and does not need a password."
        );
      if (value.length > 0 && value.length < 8)
        throw new Error("New password must be 8 or more characters long.");
    })
    .escape(),
  body("confirmPassword")
    .trim()
    .custom(async (value, { req }) => {
      if (req.body.password !== "" && value.length === 0)
        throw new Error("Please confirm your new password.");
    })
    .bail()
    .custom(async (value, { req }) => {
      if (req.body.password !== "" && value !== req.body.password)
        throw new Error("Both passwords do not match.");
    })
    .escape(),
  body("currentPassword")
    .trim()
    .custom(async (value, { req }) => {
      if (req.body.password !== "") {
        if (value.length === 0)
          throw new Error(
            "Please enter your current password in order to change it."
          );
        const match = await req.user.comparePassword(value);
        if (!match) throw new Error("Incorrect password.");
      }
    })
    .escape(),
  body("defaultInvisible").trim().isBoolean(),
  body("defaultNameColor")
    .trim()
    .optional({ values: "falsy" })
    .matches(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i)
    .withMessage("Name color must be a valid hex code."),
  validate,
  asyncHandler(async (req, res) => {
    await req.user.updateDetails(req.body);
    res.sendStatus(200);
  }),
];

export const exists = asyncHandler(async (req, res, next) => {
  const user = await User.findOne()
    .byNameOrId(req.params.user)
    .select("-__v")
    .populate({
      path: "settings",
      select: "-_id -__v",
    });
  if (user) {
    req.thisUser = user;
    next();
  } else res.status(404).send("User could not be found.");
});

export const get = [
  ...authenticate,
  exists,
  asyncHandler(async (req, res) => {
    res.json(req.thisUser);
  }),
];

export const me = [
  ...authenticate,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  }),
];

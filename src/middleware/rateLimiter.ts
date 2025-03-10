import { rateLimit } from "express-rate-limit";

const minutes = (number: number) => 60 * 1000 * number;

export const loginLimiter = [
  ...(process.env.NODE_ENV !== "test"
    ? [
        rateLimit({
          windowMs: minutes(10),
          limit: 5,
          // 5 submissions allowed every ten minutes
          standardHeaders: true,
          legacyHeaders: false,
          message:
            "Too many login attempts. Please try again in a few minutes.",
        }),
      ]
    : []),
];

export const signupLimiter = [
  ...(process.env.NODE_ENV !== "test"
    ? [
        rateLimit({
          windowMs: minutes(1),
          limit: 5,
          // 5 submissions allowed every minute
          standardHeaders: true,
          legacyHeaders: false,
          message: "Too many signup attempts. Please try again in a minute.",
        }),
      ]
    : []),
];

export const registerLimiter = [
  ...(process.env.NODE_ENV !== "test"
    ? [
        rateLimit({
          windowMs: minutes(60),
          limit: 2,
          // 2 new accounts per hour
          standardHeaders: true,
          legacyHeaders: false,
          message: "Too many signups. Don't you already have an account?",
        }),
      ]
    : []),
];

export const messageLimiter = [
  ...(process.env.NODE_ENV !== "test"
    ? [
        rateLimit({
          windowMs: 750,
          limit: 1,
          // 1 submission allowed every semi second
          standardHeaders: true,
          legacyHeaders: false,
          message: "You're sending messages too fast, slow down.",
        }),
      ]
    : []),
];

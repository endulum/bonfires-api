import asyncHandler from "express-async-handler";
import { validationResult } from "express-validator";

export const validate = asyncHandler(async (req, res, next) => {
  const errorsArray = validationResult(req).array();
  if (errorsArray.length > 0) {
    const errors = errorsArray.map((error) => ({
      value: "value" in error ? error.value : "",
      msg: error.msg,
      path: "path" in error ? error.path : "",
    }));
    if (process.env.NODE_ENV === "development")
      // log form errors
      // eslint-disable-next-line no-console
      console.dir(errors, { depth: null });
    res.status(400).json({
      errors,
    });
    return;
  }
  next();
});

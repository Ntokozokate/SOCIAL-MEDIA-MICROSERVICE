const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error ",
  });
};
module.exports = errorHandler;

// custom error class

// class APIError extends Error {
//   //this is extending the build in error class
//   constructor(message, statusCode) {
//     //need to call the parent class contractor from error
//     super(message);
//     this.statusCode = statusCode;
//     this.name = "APIError"; //set the error type to API error
//   }
// }

// //
// const asyncHandler = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };
// //Global Error Handler Middleware
// const globalerrorHandler = (err, req, res, next) => {
//   console.error(err.stack);

//   if (err instanceof APIError) {
//     return res.status(err.statusCode).json({
//       status: "Error",
//       message: err.message,
//     });
//   }

//   //handle mongoose validation
//   else if (err.name === "validationError") {
//     return res.status(400).json({
//       status: "error",
//       message: "Validation error",
//     });
//   } else {
//     return res.status(500).json({
//       status: "error",
//       message: "An unexpected error occured",
//     });
//   }
// };
// module.exports = { APIError, asyncHandler, globalerrorHandler };

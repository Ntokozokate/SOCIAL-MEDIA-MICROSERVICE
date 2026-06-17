const logger = require("../utils/logger");
const APIError = require("../errors/APIError");
const handleMongooseError = require("../errors/mongoose.errors");
const handleJWTError = require("../errors/jwt.errors");

const globalerrorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });

  err = handleMongooseError(err);
  err = handleJWTError(err);

  //app errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  //unknown programming errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
module.exports = globalerrorHandler;

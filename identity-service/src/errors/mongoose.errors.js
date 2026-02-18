const APIError = require("./APIError");

const handleMongooseError = (err) => {
  if (err.name === "ValidationError") {
    return new APIError(err.message, 400);
  }

  if (err.name === "CastError") {
    return new APIError(`Invalid ${err.path}`, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return new APIError(`${field} already exists`, 409);
  }

  return err;
};

module.exports = handleMongooseError;

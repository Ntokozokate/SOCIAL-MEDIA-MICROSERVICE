const APIError = require("./APIError");

const handleJWTError = (err) => {
  if (err.name === "JsonWebTokenError") {
    return new APIError("Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return new APIError("Token expired", 401);
  }

  return err;
};

module.exports = handleJWTError;

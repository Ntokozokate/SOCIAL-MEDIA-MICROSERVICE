//const User = require("../models/User")
const User = require("../models/User");
const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const { generateTokens } = require("../utils/generate.tokens");
const RefreshToken = require("../models/refresh.token");
const crypto = require("crypto");
const APIError = require("../errors/APIError");
const asyncHandler = require("../utils/async.handler");

//user registaration

const registerUser = asyncHandler(async (req, res) => {
  logger.info("Registration endpoint hit....");

  //validate the schema||
  const { error, value } = validateRegistration(req.body);
  if (error) {
    logger.warn("Validation error", {
      errors: error.details.map((d) => d.message),
    });
    throw new APIError("Validation error", 400);
  }
  //
  const { username, email, password } = value;

  //logger.debug("Registration attempt");

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    logger.warn("User already exists");
    throw new APIError("User already exists", 409);
  }
  //create a new user
  const user = new User({ username, email, password });
  await user.save();

  logger.info("User registered successfully", user._id);

  //create tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  return res.status(201).json({
    success: true,
    message: "User registered successfully!",
    accessToken,
    refreshToken,
  });
});

// user login
const login = asyncHandler(async (req, res) => {
  logger.info("Login endpoint hit....");

  // validate the input
  const { error, value } = validateLogin(req.body);
  if (error) {
    throw new APIError(error.details[0].message, 400);
  }
  const { email, password } = value;

  // find user by email
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn("Login attempt for non-existent email");
    throw new APIError("Invalid credentials", 401);
  }

  // verify password
  const isValidPassword = await user.comparePasswords(password);
  if (!isValidPassword) {
    logger.warn("Invalid user credentials");
    throw new APIError("Invalid user credentials", 401);
  }

  //generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);
  logger.info("token generation proceeding....");
  return res.status(200).json({
    message: "Login was successfull",
    success: true,
    accessToken,
    refreshToken,
    userId: user._id,
  });
});

//refresh token
const refreshTokenController = asyncHandler(async (req, res) => {
  logger.info("Refresh token endpoint.....");

  const { refreshToken } = req.body; // get this dta from cookies next time
  if (!refreshToken) {
    logger.warn("Refresh token missing");
    throw new APIError("refreshToken not found", 400);
  }
  //Hash the incoming raw token before searching
  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  //get stored token from the database
  const storedToken = await RefreshToken.findOne({
    token: hashedToken, // the lookup
  }).populate("user");

  if (!storedToken) {
    logger.warn(
      "Refresh token not found in the database-possible theft attempt",
    );
    throw new APIError("Invalid or expired token", 401);
  }
  if (storedToken.expiresAt < new Date()) {
    logger.info("Session Expired");
    await storedToken.deleteOne();
    throw new APIError("Session Expired", 401);
  }
  // ROTATION: delete old token first
  await storedToken.deleteOne();

  // generate new pair of tokens
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    storedToken.user,
  );

  return res.json({
    success: true,
    accessToken,
    refreshToken: newRefreshToken,
  });
});

// logout
const logOut = asyncHandler(async (req, res) => {
  logger.info("Logout endpoint hit ...");

  const { refreshToken } = req.body;
  if (!refreshToken) {
    logger.warn("No refresh token");
    throw new APIError("Refresh token missing", 400);
  }
  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const result = await RefreshToken.deleteOne({ token: hashedToken });
  if (result.deletedCount === 0) {
    logger.warn("Logout attempted with invalid or already deleted token");
  }

  //when i use cookies remeber to clear cookies
  logger.info("Refresh token deleted for logout");
  return res.status(200).json({
    success: true,
    message: "Successfully logged out",
  });
});

module.exports = { registerUser, login, refreshTokenController, logOut };

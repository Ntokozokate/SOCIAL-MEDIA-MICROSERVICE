//const User = require("../models/User")
const User = require("../models/User");
const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const { generateTokens } = require("../utils/generate.tokens");
const RefreshToken = require("../models/refresh.token");
const crypto = require("crypto");

//user registaration
//remember to always log on importatnt routes
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit....");

  try {
    //validate the schema||
    const { error, value } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", {
        errors: error.details.map((d) => d.message),
      });

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }
    //
    const { username, email, password } = value;

    //logger.debug("Registration attempt");

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      return res.status(409).json({
        success: false,
        message: "User already exists",
        errors: [],
      });
    }
    user = new User({ username, email, password });
    await user.save();

    logger.info("User saved successfully", user._id);

    //create a utility method
    const { accessToken, refreshToken } = await generateTokens(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error: %o", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// user login
const login = async (req, res) => {
  logger.info("Login endpoint hit....");

  try {
    // validate the input
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        errors: [],
      });
    }
    const { email, password } = value;

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("Login attempt for non-existent email");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // verify password
    const isValidPassword = await user.comparePasswords(password);
    if (!isValidPassword) {
      logger.warn("Invalid user credentials");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
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
  } catch (error) {
    logger.error("Failed to login", error);
    return res.status(500).json({
      message: "Could not login user",
      success: false,
      errors: [],
    });
  }
};

//refresh token
const refreshTokenController = async (req, res) => {
  logger.info("Refresh token endpoint.....");
  try {
    const { refreshToken } = req.body; // get this dta from cookies next time
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "refresh token not found",
      });
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
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }
    if (storedToken.expiresAt < new Date()) {
      logger.info("Session Expired");
      await storedToken.deleteOne();
      return res.status(401).json({
        success: false,
        message: "Session Expired",
      });
    }
    // ROTATION: delete old token first
    await storedToken.deleteOne();

    // generate new pair of tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      storedToken.user,
    );

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Failed to refresh token", error);
    return res.status(500).json({
      success: false,
      message: "Could not refresh token",
      errors: [],
    });
  }
};
//create model for refresh token

// logout
module.exports = { registerUser, login, refreshTokenController };

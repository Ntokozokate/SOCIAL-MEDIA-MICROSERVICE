//const User = require("../models/User")
const User = require("../models/User");
const logger = require("../utils/logger");
const { validateRegistration } = require("../utils/validation");
const { generateTokens } = require("../utils/generate.tokens");
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
    const { error, value } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        errors: [],
      });
    }
    const { email, password } = value;

    const user = await User.findOne({ username });

    if (!user) {
      logger.debug("User not found");
      return res.staus(403).json({
        message: "User not found or registred",
        success: false,
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
    });
  } catch (error) {
    logger.error("Failed to login");

    return res.status(500).json({
      message: "Could not login user",
      success: false,
      errors: [],
    });
  }
};

//refresh token
//create model for refresh token

// logout
module.exports = { registerUser, login };

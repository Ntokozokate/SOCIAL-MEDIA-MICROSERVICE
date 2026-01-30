const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/refresh.token");

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "60m" },
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 21);

  await RefreshToken.create({
    token: hashedToken,
    user: user._id,
    expiresAt,
  });
  return { accessToken, refreshToken }; // the hash never leaves the database so we cant return it down here
};
//in the future might want deal with the edge case when user logs in from 5 different devices, the current code just keeps dding tokens
//by limiting the number of active sessions per user
// write the logic for token rotation

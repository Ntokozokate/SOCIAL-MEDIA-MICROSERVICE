const express = require("express");
const {
  registerUser,
  login,
  refreshTokenController,
  logOut,
} = require("../controllers/identity.controller");
const { sensitiveEndPointLimiter } = require("../middleware/rate.limiter");

const router = express.Router();

router.post("/register", sensitiveEndPointLimiter, registerUser);
router.post("/login", sensitiveEndPointLimiter, login);
router.post("/refresh-token", sensitiveEndPointLimiter, refreshTokenController);
router.post("/logout", sensitiveEndPointLimiter, logOut);

module.exports = router;

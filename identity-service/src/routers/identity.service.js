const express = require("express");
const { registerUser, login } = require("../controllers/identity.controller");
const { sensitiveEndPointLimiter } = require("../middleware/rate.limiter");

const router = express.Router();

router.post("/register", sensitiveEndPointLimiter, registerUser);
router.post("/login", sensitiveEndPointLimiter, login);

module.exports = router;

const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const authenticateRequest = (req, res, next) => {
  // 1. Grab the Authorization header (e.g., "Bearer <token>")
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract just the token part

  if (!token) {
    logger.warn(`Access attempted without an authentication token`);
    return res.status(401).json({
      success: false,
      message: "Authentication required !!! Please login to continue",
    });
  }

  try {
    // 2. Verify the token signature using your JWT secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach it to the request object for internal Gateway usage
    req.user = { userId: decoded.userId, role: decoded.role };

    // 4. Inject it into the headers so express-http-proxy forwards it cleanly
    req.headers["x-user-id"] = decoded.userId;
    //req.headers["x-user-role"] = decoded.role;

    next();
  } catch (err) {
    logger.error(`JWT Verification Failure: ${err.message}`);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token. Access denied.",
    });
  }
};

module.exports = { authenticateRequest };

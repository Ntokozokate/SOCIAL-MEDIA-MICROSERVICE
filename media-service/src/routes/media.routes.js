const express = require("express");

const { uploadMedia } = require("../controllers/media.controller");
const { authenticateGatewayRequest } = require("../middleware/auth.middleware");
const { parseAndvalidateFile } = require("../middleware/multer");

const router = express.Router();

router.post(
  "/upload",
  authenticateGatewayRequest,
  parseAndvalidateFile,
  uploadMedia,
);

module.exports = router;

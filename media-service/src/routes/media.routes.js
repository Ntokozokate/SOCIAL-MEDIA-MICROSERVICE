const express = require("express");

const {
  uploadMedia,
  getAllMedias,
} = require("../controllers/media.controller");
const { authenticateGatewayRequest } = require("../middleware/auth.middleware");
const { parseAndvalidateFile } = require("../middleware/multer");

const router = express.Router();

router.post(
  "/upload",
  authenticateGatewayRequest,
  parseAndvalidateFile,
  uploadMedia,
);

router.get("/getall", authenticateGatewayRequest, getAllMedias);

module.exports = router;

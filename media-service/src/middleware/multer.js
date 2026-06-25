const multer = require("multer");
const logger = require("../utils/logger");

const storage = multer.memoryStorage();
const uploadConfig = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, //gb limit
  },
}).single("file"); // field name must be file

//imiddleware wrapper function
const parseAndvalidateFile = (req, res, next) => {
  uploadConfig(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      logger.error("Multer error while uploading file :", err);
      return res.status(400).json({
        message: "Multer error while uploading",
        error: err.message,
        stack: err.stack,
      });
    } else if (err) {
      logger.error("Unknown Multer error occurred while uploading", err);
      return res.status(500).json({
        message: "Unknown Multer error occured while uploading file",
        error: err.message,
        stack: err.stack,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file found",
      });
    }
    //middleware handover
    next();
  });
};

module.exports = { parseAndvalidateFile };

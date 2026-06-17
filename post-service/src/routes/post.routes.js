const express = require("express");
const { authenticateRequest } = require("../middleware/auth.middleware");

const router = express();

const {
  createPost,
  getAllPosts,
  getSinglePost,
} = require("../controllers/post.controller");

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/get-all-posts", getAllPosts);
router.get("/get-post", getSinglePost);

module.exports = router;

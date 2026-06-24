const express = require("express");
const { authenticateRequest } = require("../middleware/auth.middleware");

const router = express();

const {
  createPost,
  getAllPosts,
  getSinglePost,
  deletePost,
  updatePost,
} = require("../controllers/post.controller");

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/get-posts", getAllPosts);
router.get("/:id", getSinglePost);
router.delete("/:id", deletePost);
router.patch("/:id", updatePost);

module.exports = router;

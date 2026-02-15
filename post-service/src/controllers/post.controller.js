const logger = require("../utils/logger");
const Post = require("../models/Post");

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");

  try {
    const { title, content, mediaIds } = req.body;

    const newPost = new Post({
      author: req.user.userId,
      title,
      content,

      mediaIds: mediaIds || [],
    });

    await newPost.save();
    logger.info("Post created successfully", newPost);
    return res.status(201).json({
      success: true,
      message: "Post created",
      Id: newPost._id,
    });
  } catch (error) {
    logger.error("Error creating post", error);
    return res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};
const getAllPost = async (req, res) => {
  logger.info("Get all Posts end point reached");

  try {
  } catch (error) {
    logger.error("Error getting all posts", error);
    return res.status(500).json({
      success: false,
      message: "Error getting all posts",
    });
  }
};
const getSinglePost = async (req, res) => {
  logger.info("Getting single post endpoint hit");

  try {
  } catch (error) {
    logger.error("Error getting post by ID", error);
    return res.status(500).json({
      success: false,
      message: "Error getting post by ID",
    });
  }
};
const deletePost = async (req, res) => {
  logger.info("Deleting single post endpoint hit");

  try {
  } catch (error) {
    logger.error("Error deleting post", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

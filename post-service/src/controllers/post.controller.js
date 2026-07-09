const logger = require("../utils/logger");
const Post = require("../models/Post");
const { publishEvent } = require("../utils/rabbitmq");
const {
  validateCreatePost,
  validateUpdatePost,
} = require("../utils/validation");
const redisClient = require("../middleware/ioredis.client");

//delete cached keys and post helper function
async function invalidatePostCache(req, input) {
  const cacheKey = `post:${input}`;
  await redisClient.del(cacheKey);

  const keys = await redisClient.keys("posts:*");
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");

  // validate the schema
  const { error } = validateCreatePost(req.body);
  if (error) {
    logger.warn("Create Post validation error", {
      errors: error.details.map((d) => d.message),
    });
    return res.status(400).json({
      success: false.value,
      validationErrors: error.details.map((d) => d.message),
    });
    //throw new APIError("Joi Schema Validation error", 400);
  }
  try {
    const { title, content, mediaIds } = req.body;

    const newPost = new Post({
      author: req.user.userId,
      title,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();

    // //publish the post.created(the keyname)---consume this from where its needed eg search service
    await publishEvent("post.created", {
      postId: newPost._id.toString(),
      userId: newPost.author.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    });

    await invalidatePostCache(newPost._id.toString());
    logger.info("Post created successfully", { postId: newPost._id });
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

const getAllPosts = async (req, res) => {
  logger.info("Get all Posts end point hit");

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Key matches the exact page request
    const cacheKey = `posts:page:${page}:limit:${limit}`;
    const cachedPosts = await redisClient.get(cacheKey);

    if (cachedPosts) {
      logger.info("Cache hit for all posts", { limit });
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedPosts),
      });
    }

    logger.info("Cache miss for all posts, querying DB", { page, limit });

    //Run queries in parallel to save time
    const [posts, totalPosts] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(startIndex).limit(limit),
      Post.countDocuments(),
    ]);
    const results = {
      posts,
      currentpage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts: totalPosts,
    };
    // save post in redis
    await redisClient.set(cacheKey, JSON.stringify(results), "EX", 3600);

    return res.json(results);
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
    const postId = req.params.id;
    const cachekey = `post:${postId}`;
    const cachedPost = await redisClient.get(cachekey); //1 create special key
    //check if post exists
    if (cachedPost) {
      logger.info("Cache hit for single post", { postId }); //come back here
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedPost),
      });
    }
    // 2 Cache Miss - DB Query
    logger.info("Cache miss for single post, now querying DB", { postId });
    const post = await Post.findById(postId);

    if (!post) {
      logger.warn("Post does not found in the DB", { postId });
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }
    //3 // if all is good proceed to save post to redis with .set()
    await redisClient.set(cachekey, JSON.stringify(post), "EX", 3600);

    return res.status(200).json({
      success: true,
      data: post,
    });
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

  //only the user that poste the post cn delete the podt hense we need the actual user(byuserId) and the actual post
  const postId = req.params.id;
  const user = req.user.userId;
  try {
    const deletedPost = await Post.findOneAndDelete({
      _id: postId,
      author: user,
    });

    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: "Could not find post",
      });
    }
    //publish post delete method ->
    await publishEvent("post.deleted", {
      postId: deletedPost._id.toString(),
      userId: user,
      mediaIds: deletedPost.mediaIds || [],
    });
    //invalidate redis
    await invalidatePostCache(req, req.params.id);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

const updatePost = async (req, res) => {
  logger.info("Update post endpoint hit");

  const postId = req.params.id;
  const user = req.user.userId;

  //validate schema data
  const { error } = validateUpdatePost(req.body);
  if (error) {
    logger.warn("Validation error updating post", {
      errors: error.details.map((d) => d.message),
    });
    return res.status(400).json({
      success: false,
      validationErrors: error.details.map((d) => d.message),
    });
  }

  try {
    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: postId,
        author: user,
      },
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Could not find the post or un authorized editor",
      });
    }
    // Invalidate old post by postId only
    await invalidatePostCache(req, postId);
    logger.info("Post Updated and cache cleared successfully", { postId });

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    logger.error("Error updating post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getSinglePost,
  deletePost,
  updatePost,
};

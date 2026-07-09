const Search = require("../models/Search");
const logger = require("../utils/logger");

async function handlePostCreated(event) {
  try {
    const updatedSeachPost = await Search.findOneAndUpdate(
      {
        postId: event.postId,
      },
      {
        userId: event.userId,
        content: event.content,
        createdAt: event.createdAt,
      },
      { upset: true, new: true }, // Creates it if it doesnt exist, update if it does
    );

    logger.info(
      `Search post syncronized/created: ${event.postId}, Doc Id: ${updatedSeachPost._id.toString()}`,
    );
  } catch (e) {
    logger.error(e, "Error handling post creation event");
  }
}

async function handlePostDeleted(event) {
  try {
    const deletedPost = await Search.findOneAndDelete({ postId: event.postId });
    if (!deletedPost) {
      logger.warn(
        `Search post deletion skipped: Post ${event.postId} not found in index`,
      );
      return;
    }
    logger.info(`Search post deleted: ${event.postId}}`);
  } catch (error) {
    logger.error(error, "Error handling post deletion event");
  }
}

module.exports = { handlePostCreated, handlePostDeleted };

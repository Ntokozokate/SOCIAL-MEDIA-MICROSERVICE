const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  //console.log(event, "eventeventevent");
  const { postId, mediaIds } = event;
  //Media only stores userId, not postId, so this handler should filter by both mediaIds and userId. Deleting by _id alone lets a post carry another account’s media IDs and remove those files too.

  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      logger.info(
        `Deleted media ${media._id} associated with this deleted post ${postId}`,
      );
    }

    logger.info(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    logger.error(e, "Error occured during media deletion");
  }
};

module.exports = { handlePostDeleted };

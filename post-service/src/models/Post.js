const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post tittle is required"],
      trim: true,
      maxlength: 100,
      index: true, // Optimization for search-heavy apps
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 15,
    },
    mediaIds: {
      type: [String],
      validate: {
        validator: function (v) {
          // check if the url is valid
          return v ? /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v) : true;
        },
        message: "Please provide a valid URL",
      },
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

postSchema.index({ title: "text", content: "text" });

const Post = mongoose.model("Post", postSchema);
module.exports = Post;

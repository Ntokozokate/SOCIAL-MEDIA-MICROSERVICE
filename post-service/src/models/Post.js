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

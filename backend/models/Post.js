const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: {
    name: String,
    profileImage: String
  },
  image: String,
  title: String,
  body: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Post", postSchema);
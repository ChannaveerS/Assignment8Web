const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;

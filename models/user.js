const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false },
  name: { type: String }, // Added Name
  image: { type: String }, // Added Profile Image
  registeredEvents: { type: Array, default: [] },
});

module.exports = mongoose.model("User", UserSchema);

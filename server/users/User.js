const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: { type: String, required: true, minlength: 4 },
  race: {
    type: String,
    required: true
  }
});

userSchema.pre("save", function(next) {
  bcrypt.hash(this.password, 10).then(hash => {
    this.password = hash;

    next();
  });
});

userSchema.methods.verifyPassword = function(guess, cb) {
  bcrypt.compare(guess, this.password, function(err, isValid) {
    if (err) {
      return cb(err);
    }
    cb(null, isValid);
  });
};

module.exports = mongoose.model("User", userSchema, "users");

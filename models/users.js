const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  role: { type: String, enum: ['admin', 'manager', 'customer'], required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  disabled: { type: Boolean, default: false },
  updatedAt: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  previousLogin: { type: Date, default: null},
  lastFailedLogin: { type: Date, default: null },
  lastChangePwrd: { type: Date, default: null },
  passwordHistory: [String], // array of previously hashed passwords

  // Security questions
  securityQuestion1: { type: String },
  securityAnswer1: { type: String }, // You should store a hashed version
  securityQuestion2: { type: String },
  securityAnswer2: { type: String }  // Hashed version too
});

module.exports = mongoose.model('User', userSchema);
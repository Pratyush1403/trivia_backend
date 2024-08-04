const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  scores: [{ score: Number, date: Date }],
});

module.exports = mongoose.model('User', userSchema);
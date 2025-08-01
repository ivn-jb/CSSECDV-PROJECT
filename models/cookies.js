const mongoose = require('mongoose');

const cookieSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: { type: String, default: '/images/default-cookie.jpg' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cookie', cookieSchema);
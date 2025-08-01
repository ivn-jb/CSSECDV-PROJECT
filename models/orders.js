const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  cookieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cookie', required: true },
  cookieName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled', 'processing', 'delivered', 'shipped'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Order', orderSchema);
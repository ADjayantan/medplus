const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:  String,
  price: Number,
  qty:   Number,
  image: String
});

const orderSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:         [orderItemSchema],
  total:         { type: Number, required: true },
  address:       { type: String, required: true },
  phone:         { type: String, required: true },
  paymentMethod: { type: String, enum: ['COD', 'UPI', 'Card', 'NetBanking'], default: 'COD' },
  status:        { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);

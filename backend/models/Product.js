const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:                 { type: String, required: true, trim: true },
  price:                { type: Number, required: true },
  mrp:                  { type: Number, required: true },
  category:             { type: String, required: true },
  description:          { type: String, default: '' },
  image:                { type: String, default: '' },
  stock:                { type: Boolean, default: true },
  requiresPrescription: { type: Boolean, default: false },
  manufacturer:         { type: String, default: '' },
  rating:               { type: Number, default: 4.0 },
  reviews:              { type: Number, default: 0 },
  tags:                 [String]
});

module.exports = mongoose.model('Product', productSchema);

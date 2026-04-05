const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename:   { type: String, required: true },
  url:        { type: String, required: true },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:  { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);

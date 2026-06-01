
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true, trim: true, minlength: 1 },
  customerName: { type: String, trim: true, default: '' },
  customerPhone: { type: String, trim: true, default: '' },
  customerEmail: { type: String, trim: true, lowercase: true, default: '' },
  customerNotes: { type: String, default: '' },
  address: { type: String, required: true, trim: true, minlength: 1 },
  notes: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  photos: [String],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
  reminder: { type: Date, default: null },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Job', JobSchema);

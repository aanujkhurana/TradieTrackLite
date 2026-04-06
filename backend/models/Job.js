
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1 },
  address: { type: String, required: true, trim: true, minlength: 1 },
  notes: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  photos: [String],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
  reminder: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);

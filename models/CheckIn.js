const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
  },
  { timestamps: true }
);

checkInSchema.index({ goalId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.CheckIn || mongoose.model('CheckIn', checkInSchema);
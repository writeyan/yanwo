const mongoose = require('mongoose');

const pageVisitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, maxlength: 500 },
    referer: { type: String, default: '', maxlength: 1000 },
    refererHost: { type: String, default: '', maxlength: 255 },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  },
  { timestamps: true }
);

pageVisitSchema.index({ createdAt: -1 });
pageVisitSchema.index({ refererHost: 1, createdAt: -1 });

module.exports = mongoose.model('PageVisit', pageVisitSchema);

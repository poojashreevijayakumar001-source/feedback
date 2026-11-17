import mongoose from 'mongoose'
const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'General' },
  rating: { type: Number, min: 1, max: 5, required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['New', 'Reviewed', 'Resolved'], default: 'New' },
  reply: { type: String, default: '' },
}, { timestamps: true })
export default mongoose.model('Feedback', feedbackSchema)

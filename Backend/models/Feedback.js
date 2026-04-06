// models/Feedback.js
const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String, required: true },
    replies: [replySchema], // ✅ New
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);

const Feedback = require("../models/Feedback");

// ✅ Add feedback (same)
const addFeedback = async (req, res) => {
  const { event_id, rating, comments } = req.body;
  const feedback = await Feedback.create({
    event_id,
    user_id: req.user._id,
    rating,
    comments,
  });
  res.status(201).json(feedback);
};

// ✅ Get feedbacks
const getFeedbacks = async (req, res) => {
  const { eventId } = req.query;

  const feedbacks = await Feedback.find({ event_id: eventId })
    .populate("user_id", "fullName college")
    .populate("replies.user_id", "fullName college");

  res.json(feedbacks);
};

// ✅ Edit feedback (only feedback owner)
const editFeedback = async (req, res) => {
  const { id } = req.params;
  const { rating, comments } = req.body;

  const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ message: "Feedback not found" });

  if (feedback.user_id.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized" });

  feedback.rating = rating;
  feedback.comments = comments;
  await feedback.save();
  res.json(feedback);
};

// ✅ Delete feedback (owner or admin)
const deleteFeedback = async (req, res) => {
  const { id } = req.params;

  const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ message: "Feedback not found" });

  // Allow owner or College Admin
  if (
    feedback.user_id.toString() !== req.user._id.toString() &&
    req.user.accountType !== "College Admin"
  ) {
    return res.status(403).json({ message: "Not authorized to delete this feedback" });
  }

  await feedback.deleteOne();
  res.json({ message: "Feedback deleted successfully" });
};

// ✅ Add reply (any user can reply)
const addReply = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ message: "Feedback not found" });

  feedback.replies.push({ user_id: req.user._id, comment });
  await feedback.save();

  const updated = await Feedback.findById(id)
    .populate("replies.user_id", "fullName college");
  res.json(updated);
};

module.exports = {
  addFeedback,
  getFeedbacks,
  editFeedback,
  deleteFeedback,
  addReply,
};

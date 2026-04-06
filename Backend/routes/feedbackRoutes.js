const express = require("express");
const {
  addFeedback,
  getFeedbacks,
  editFeedback,
  deleteFeedback,
  addReply,
} = require("../controllers/feedbackController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Feedback Access Rules
 * ----------------------------------------
 * Student        → can add feedback, view feedbacks
 * College Admin  → can reply, edit, delete feedback for their college
 * Super Admin    → can view, edit, delete any feedback globally
 */

// 🔹 Add Feedback (Students & Admins)
router.post(
  "/",
  protect,
  addFeedback
);

// 🔹 Get All Feedbacks (Anyone logged in)
router.get("/", protect, getFeedbacks);

// 🔹 Edit Feedback
router.put(
  "/:id",
  protect,
  editFeedback
);

// 🔹 Delete Feedback
router.delete(
  "/:id",
  protect,
  deleteFeedback
);

// 🔹 Add Reply (Admins & Super Admins)
router.post(
  "/:id/replies",
  protect,
  addReply
);

module.exports = router;

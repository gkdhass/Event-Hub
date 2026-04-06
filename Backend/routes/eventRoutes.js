const express = require("express");
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// 🔹 Public route for all authenticated users (Students, Admins, Super Admin)
router.get("/", protect, getEvents);

// 🔹 Public single event view
router.get("/:id", protect, getEventById);

// 🔹 Protected routes (College Admin or Super Admin)
router.post("/", protect, authorizeRoles("College Admin", "Super Admin"), createEvent);
router.put("/:id", protect, authorizeRoles("College Admin", "Super Admin"), updateEvent);
router.delete("/:id", protect, authorizeRoles("College Admin", "Super Admin"), deleteEvent);

module.exports = router;

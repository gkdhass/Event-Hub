const express = require("express");
const {
  registerForEvent,
  cancelRegistration,
  myRegistrations,
  manageRegistration,
  getEventRegistrations,
  listRegistrations,
  updateRegistration,
  downloadTicket,
} = require("../controllers/registrationController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * REGISTRATION ACCESS CONTROL
 * ----------------------------------------
 * Student        → register, cancel, view own registrations, download ticket
 * College Admin  → manage registrations for their college events
 * Super Admin    → view and manage all registrations across all colleges
 */

// 🔹 Student routes
router.post(
  "/",
  protect,
  authorizeRoles("Student", "Super Admin"), // Allow super admin testing/override
  registerForEvent
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("Student", "Super Admin"),
  cancelRegistration
);
router.get(
  "/me",
  protect,
  authorizeRoles("Student", "Super Admin"),
  myRegistrations
);
router.get(
  "/:id/ticket",
  protect,
  authorizeRoles("Student", "Super Admin"),
  downloadTicket
);

// 🔹 Admin & Super Admin routes
router.put(
  "/manage",
  protect,
  authorizeRoles("College Admin", "Super Admin"),
  manageRegistration
);
router.get(
  "/event/:eventId",
  protect,
  authorizeRoles("College Admin", "Super Admin"),
  getEventRegistrations
);
router.get(
  "/",
  protect,
  authorizeRoles("College Admin", "Super Admin"),
  listRegistrations
);
router.put(
  "/:id",
  protect,
  authorizeRoles("College Admin", "Super Admin"),
  updateRegistration
);

module.exports = router;

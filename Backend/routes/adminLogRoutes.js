const express = require("express");
const { listAdminLogs, createAdminLog } = require("../controllers/adminLogController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET all logs
router.get("/", protect, listAdminLogs);

// POST new log (admin action)
router.post("/", protect, createAdminLog);

module.exports = router;

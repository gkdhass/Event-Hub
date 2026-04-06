const AdminLog = require("../models/AdminLog");

// Get all logs with admin details
const listAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate("user_id", "fullName email accountType") // fetch details of the admin
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};

// Create a new log entry
const createAdminLog = async (req, res) => {
  try {
    const { action } = req.body;

    // user_id comes from logged-in admin (via protect middleware)
    const log = await AdminLog.create({
      user_id: req.user._id, 
      action,
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: "Failed to create log" });
  }
};

module.exports = { listAdminLogs, createAdminLog };

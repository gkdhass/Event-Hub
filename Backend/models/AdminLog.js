const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminLog", adminLogSchema);

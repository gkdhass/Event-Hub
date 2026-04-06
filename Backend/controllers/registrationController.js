const Registration = require("../models/Registration");
const AdminLog = require("../models/AdminLog");
const Event = require("../models/Event");
const User = require("../models/User"); // if you need direct access; population normally suffices

const mongoose = require("mongoose");

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// Student registers for event
const registerForEvent = async (req, res) => {
  try {
    const { event_id } = req.body;

    // prevent duplicate registrations
    const exists = await Registration.findOne({
      event_id,
      user_id: req.user._id,
    });

    if (exists) {
      return res.status(400).json({ message: "Already registered" });
    }

    const registration = await Registration.create({
      event_id,
      user_id: req.user._id,
    });

    // ✅ Log student action
    await AdminLog.create({
      user_id: req.user._id,
      action: `Registered for event ID: ${event_id}`,
    });

    res.status(201).json(registration);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Student cancels registration

const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑 Attempting to cancel registration ID:", id);
    console.log("👤 Requesting user:", req.user.fullName, "| Role:", req.user.accountType);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid registration ID" });
    }

    const userRole = req.user.accountType;
    let registration;

    if (userRole === "Super Admin") {
      // 🔹 Super Admin can delete ANY registration
      registration = await Registration.findById(id).populate("event_id", "title");
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      await registration.deleteOne();
    } else if (userRole === "College Admin") {
      // 🔹 College Admin can delete registrations only for their college's events (optional)
      registration = await Registration.findById(id)
        .populate({
          path: "event_id",
          select: "title college",
        });

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      if (registration.event_id.college !== req.user.college) {
        return res.status(403).json({ message: "You can only manage your college's registrations" });
      }

      await registration.deleteOne();
    } else if (userRole === "Student") {
      // 🔹 Student can cancel only their own registration
      registration = await Registration.findOneAndDelete({
        _id: id,
        user_id: req.user._id,
      }).populate("event_id", "title");

      if (!registration) {
        return res.status(403).json({ message: "You are not authorized to cancel this registration" });
      }
    } else {
      return res.status(403).json({ message: "Access denied: Invalid role" });
    }

    // 🧾 Log action
    try {
      await AdminLog.create({
        user_id: req.user._id,
        action: `Cancelled registration for event "${registration.event_id?.title || "Unknown"}"`,
      });
    } catch (logErr) {
      console.warn("⚠️ Log creation failed:", logErr);
    }

    return res.status(200).json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error("❌ Cancel registration error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};




// Get all registrations for logged-in student
const myRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      user_id: req.user._id,
    }).populate("event_id");

    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin manages (approve/reject)
const manageRegistration = async (req, res) => {
  try {
    const { registrationId, status } = req.body;

    const registration = await Registration.findByIdAndUpdate(
      registrationId,
      { status },
      { new: true }
    )
      .populate("user_id", "fullName email college")
      .populate("event_id", "title");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // ✅ Log admin action
    await AdminLog.create({
      user_id: req.user._id,
      action: `Changed registration status of ${registration.user_id.fullName} (${registration.user_id.email}) for event "${registration.event_id.title}" to ${status}`,
    });

    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get all registrations for an event
const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await Registration.find({ event_id: eventId })
      .populate("user_id", "fullName email college")
      .populate("event_id", "title category");

    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all registrations (with populated user + event)
const listAllRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find()
      .populate("user_id", "fullName email")
      .populate("event_id", "title");
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};
// ✅ Get only registrations related to logged-in admin’s events
const listRegistrations = async (req, res) => {
  try {
    // detect user role
    const userRole = req.user.role || req.user.accountType;

    // if Super Admin, return all
    if (userRole === "Super Admin") {
      const allRegs = await Registration.find()
        .populate({
          path: "event_id",
          populate: { path: "college_id", select: "fullName email college" },
        })
        .populate("user_id", "fullName email");
      return res.json(allRegs);
    }

    // ✅ College Admin → only their own events’ registrations
    if (userRole === "College Admin") {
      const registrations = await Registration.find()
        .populate({
          path: "event_id",
          match: { college_id: req.user._id }, // filters by admin’s events
          populate: { path: "college_id", select: "fullName email college" },
        })
        .populate("user_id", "fullName email");

      // Filter out registrations with no event (because of match)
      const filtered = registrations.filter((r) => r.event_id !== null);

      return res.json(filtered);
    }

    // ✅ Students → only their own registrations
    const myRegs = await Registration.find({ user_id: req.user._id })
      .populate("event_id", "title")
      .populate("user_id", "fullName email");
    res.json(myRegs);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};


// Update registration status (approve/reject)
const updateRegistration = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const reg = await Registration.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("user_id", "fullName email")
      .populate("event_id", "title");

    if (!reg) return res.status(404).json({ message: "Registration not found" });

    // ✅ Log admin update
    await AdminLog.create({
      user_id: req.user._id,
      action: `Updated registration of ${reg.user_id.fullName} (${reg.user_id.email}) for event "${reg.event_id.title}" → ${status}`,
    });

    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: "Failed to update registration" });
  }
};

// Download ticket (streams generated PDF)
const downloadTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid registration id" });
    }

    // Populate registration with event and user
    const registration = await Registration.findById(id)
      .populate("event_id")
      .populate("user_id");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Authorization:
    // - students can download their own approved tickets
    // - college admins can download tickets for registrations of events they own
    // - super admin can download all
    const userRole = req.user.role || req.user.accountType || "";
    const isOwnerStudent = registration.user_id._id.toString() === req.user._id.toString();
    const eventOwnerId = registration.event_id?.college_id?.toString?.() || registration.event_id?.college_id;
    const isCollegeAdminOwner = userRole === "College Admin" && eventOwnerId === req.user._id.toString();
    const isSuperAdmin = userRole === "Super Admin";

    if (!isSuperAdmin && !isOwnerStudent && !isCollegeAdminOwner) {
      return res.status(403).json({ message: "Not authorized to download this ticket" });
    }

    // Only allow approved registrations to download ticket (adjust if you want otherwise)
    if (registration.status !== "approved" && !isSuperAdmin && !isCollegeAdminOwner) {
      return res.status(403).json({ message: "Ticket available only for approved registrations" });
    }

    // Build PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    // Set headers for file download
    const safeTitle = registration.event_id?.title?.replace(/[^a-z0-9_\- ]/gi, "_") || "ticket";
    const filename = `${safeTitle}_Ticket_${registration._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Optional: Add banner/logo if you want (look for a file/path or URL)
    // If you want to include a local logo, uncomment and change path:
    // const logoPath = path.join(__dirname, "../public/logo.png");
    // if (fs.existsSync(logoPath)) doc.image(logoPath, { fit: [100, 100] });

    // Header
    doc.fontSize(20).text("Event Ticket", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("gray").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    // Event section
    doc.fillColor("black").fontSize(16).text(registration.event_id.title || "Event", { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).fillColor("black");
    doc.text(`Category: ${registration.event_id.category || "N/A"}`);
    doc.text(`Location: ${registration.event_id.location || "N/A"}`);
    doc.text(`Dates: ${new Date(registration.event_id.start_date).toDateString()} - ${new Date(registration.event_id.end_date).toDateString()}`);
    doc.moveDown(0.8);

    // Attendee section
    doc.fontSize(14).text("Attendee", { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(11).text(`Name: ${registration.user_id.fullName || "N/A"}`);
    doc.text(`Email: ${registration.user_id.email || "N/A"}`);
    doc.text(`College: ${registration.user_id.college || "N/A"}`);
    doc.moveDown(0.8);

    // Registration / Ticket info
    doc.fontSize(12).text(`Registration ID: ${registration._id}`);
    doc.text(`Status: ${registration.status}`);
    doc.text(`Registered On: ${new Date(registration.createdAt).toLocaleString()}`);
    doc.moveDown(1);

    // Generate QR code (data URL) encoding verification payload (id + event)
    const qrPayload = JSON.stringify({
      registrationId: registration._id,
      eventId: registration.event_id._id,
      userId: registration.user_id._id,
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 200 });

      // Insert QR code into PDF
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
      const qrBuffer = Buffer.from(base64Data, "base64");

      // Place QR code at right side
      const currentY = doc.y;
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const qrSize = 110;
      const qrX = doc.x + pageWidth - qrSize; // right aligned
      doc.image(qrBuffer, qrX, currentY - 10, { fit: [qrSize, qrSize], align: "right" });

      // Add verification note next to QR
      doc.moveDown(0.2);
    } catch (qrErr) {
      console.warn("QR generation failed:", qrErr);
      // continue without qr
    }

    doc.moveDown(2);

    // Footer / instructions
    doc.fontSize(10).fillColor("gray").text("Present this ticket at the event entrance. QR code verifies your registration.", { align: "left" });

    // Finish
    doc.end();
    // No res.json after streaming - the PDF stream is already sent
  } catch (err) {
    console.error("Error generating ticket:", err);
    // if headers not sent
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating ticket" });
    } else {
      // connection probably already streaming
      res.end();
    }
  }
};


module.exports = {
  registerForEvent,
  cancelRegistration,
  myRegistrations,
  manageRegistration,
  getEventRegistrations,
  listRegistrations,
  updateRegistration,
  downloadTicket,
};

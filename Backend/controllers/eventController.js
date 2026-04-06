const Event = require("../models/Event");

// ✅ Create Event (Admin only)
const createEvent = async (req, res) => {
  try {
    const { title, description, category, location, start_date, end_date, banner } = req.body;

    const event = await Event.create({
      college_id: req.user._id, // created by College Admin
      title,
      description,
      category,
      location,
      start_date,
      end_date,
      banner,
    });

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create event" });
  }
};

// ✅ Get All Events (with filters)
const getEvents = async (req, res) => {
  try {
    const { category, college, location, start_date, end_date, title } = req.query;
    const filters = {};

    if (category) filters.category = category;

    if (college) {
      if (college === "me") filters.college_id = req.user._id;
      else filters.college_id = college;
    }

    if (location) filters.location = { $regex: location, $options: "i" };
    if (title) filters.title = { $regex: title, $options: "i" };

    if (start_date && end_date) {
      filters.start_date = { $gte: new Date(start_date), $lte: new Date(end_date) };
    } else if (start_date) {
      filters.start_date = { $gte: new Date(start_date) };
    } else if (end_date) {
      filters.start_date = { $lte: new Date(end_date) };
    }

    const events = await Event.find(filters)
      .populate("college_id", "fullName email college accountType")
      .sort({ start_date: 1 });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// ✅ Get Single Event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "college_id",
      "fullName email college accountType"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch event" });
  }
};

// ✅ Update Event (College Admin OR Super Admin)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // ✅ Allow Super Admin or the event’s owning College Admin
    if (
      event.college_id.toString() !== req.user._id.toString() &&
      req.user.accountType !== "Super Admin"
    ) {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }

    const { title, description, category, location, start_date, end_date, banner } = req.body;

    event.title = title ?? event.title;
    event.description = description ?? event.description;
    event.category = category ?? event.category;
    event.location = location ?? event.location;
    event.start_date = start_date ?? event.start_date;
    event.end_date = end_date ?? event.end_date;
    event.banner = banner ?? event.banner;

    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update event" });
  }
};

// ✅ Delete Event (College Admin OR Super Admin)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // ✅ Allow Super Admin or the event’s owning College Admin
    if (
      event.college_id.toString() !== req.user._id.toString() &&
      req.user.accountType !== "Super Admin"
    ) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};

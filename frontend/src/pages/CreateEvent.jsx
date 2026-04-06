import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

function CreateEvent() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "sports",
    location: "",
    start_date: "",
    end_date: "",
    banner: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // ✅ Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized! Please log in again.");
      navigate("/login");
      return;
    }

    // ✅ API call to create event
    const response = await api.post("/events", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // ✅ Success feedback
    if (response.status === 201 || response.status === 200) {
      toast.success("🎉 Event created successfully!");
    } else {
      toast.warning("Event created, but unexpected response received.");
    }

    // ✅ Retrieve user info (safer access)
    const user = JSON.parse(localStorage.getItem("user"));

    // ✅ Redirect based on account type
    if (user?.accountType === "Super Admin") {
      navigate("/superadmin-dashboard");
    } else if (user?.accountType === "College Admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/"); // fallback route for safety
    }

  } catch (error) {
    console.error("❌ Error creating event:", error);

    // ✅ Detailed error handling
    if (error.response) {
      toast.error(error.response.data?.message || "Server error while creating event");
    } else if (error.request) {
      toast.error("No response from server. Please check your internet connection.");
    } else {
      toast.error("Unexpected error occurred while creating the event.");
    }
  }
};


  return (
    <div className="container my-5">
      <div className="card shadow-lg p-4">
        <h2 className="mb-3"><i className="fa fa-calendar-plus me-2"></i>Create Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="Event Title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <textarea
              name="description"
              className="form-control"
              placeholder="Event Description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <select
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="sports">Sports</option>
              <option value="hackathon">Hackathon</option>
              <option value="cultural">Cultural</option>
              <option value="workshop">Workshop</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-3">
            <input
              type="text"
              name="location"
              className="form-control"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="start_date"
                className="form-control"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="end_date"
                className="form-control"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <input
              type="text"
              name="banner"
              className="form-control"
              placeholder="Banner Image URL"
              value={formData.banner}
              onChange={handleChange}
            />
          </div>

          <button className="btn btn-success w-100">
            <i className="fa fa-plus-circle me-2"></i>Create Event
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;

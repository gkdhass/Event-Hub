import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    start_date: "",
    end_date: "",
    banner: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        const e = res.data;
        setEventData({
          title: e.title,
          description: e.description,
          category: e.category,
          location: e.location,
          start_date: e.start_date.split("T")[0],
          end_date: e.end_date.split("T")[0],
          banner: e.banner || "",
        });
      } catch (err) {
        toast.error("Failed to load event");
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/events/${id}`, eventData);
      toast.success("Event updated successfully");

      // ✅ Get user from localStorage
      const user = JSON.parse(localStorage.getItem("user"));

      // ✅ Navigate based on account type
      if (user?.accountType === "Super Admin") {
        navigate("/superadmin-dashboard");
      } else {
        navigate("/admin-dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update event");
    }
  };


  return (
    <div className="container my-5">
      <h2>
        <i className="fa fa-edit me-2"></i>Edit Event
      </h2>
      <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            name="title"
            className="form-control"
            value={eventData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            className="form-control"
            rows="3"
            value={eventData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Category</label>
          <select
            name="category"
            className="form-select"
            value={eventData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="sports">Sports</option>
            <option value="hackathon">Hackathon</option>
            <option value="cultural">Cultural</option>
            <option value="workshop">Workshop</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Location</label>
          <input
            type="text"
            name="location"
            className="form-control"
            value={eventData.location}
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
              value={eventData.start_date}
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
              value={eventData.end_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Banner (URL)</label>
          <input
            type="text"
            name="banner"
            className="form-control"
            value={eventData.banner}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          <i className="fa fa-save me-1"></i> Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditEvent;

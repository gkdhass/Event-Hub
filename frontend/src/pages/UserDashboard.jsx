import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { FaUser, FaFileDownload } from "react-icons/fa";

function UserDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredRegs = registrations.filter(r =>
    filterStatus === "all" ? true : r.status === filterStatus
  );

  const stats = {
    total: registrations.length,
    approved: registrations.filter(r => r.status === "approved").length,
    pending: registrations.filter(r => r.status === "pending").length,
    rejected: registrations.filter(r => r.status === "rejected").length,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resEvents = await api.get("/events");
        setEvents(resEvents.data);
        const resRegs = await api.get("/registrations/me");
        setRegistrations(resRegs.data);
        const resUser = await api.get("/auth/profile");
        setUser(resUser.data);
      } catch (err) {
        toast.error("Failed to load dashboard data");
      }
    };
    fetchData();
  }, []);

  const downloadTicket = async (registrationId, eventTitle) => {
    try {
      // If your api instance attaches token automatically, you can omit headers below
      const token = localStorage.getItem("token");

      const response = await api.get(`/registrations/${registrationId}/ticket`, {
        responseType: "blob",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = (eventTitle || "ticket").replace(/[^a-z0-9_\- ]/gi, "_");
      link.setAttribute("download", `${safeTitle}_Ticket_${registrationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download ticket error:", err);
      // Prefer server message if present
      const msg = err?.response?.data?.message || "Failed to download ticket";
      toast.error(msg);
    }
  };

  return (
    <div className="container my-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaUser className="me-2" /> Student Dashboard
        </h2>
        <div>
          <button
            className={`btn btn-sm me-2 ${tab === "dashboard" ? "btn-primary" : "btn-outline-primary"
              }`}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`btn btn-sm ${tab === "allEvents" ? "btn-primary" : "btn-outline-primary"
              }`}
            onClick={() => setTab("allEvents")}
          >
            All Events
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {tab === "dashboard" && (
        <div className="row">
          {/* Profile Section */}
          <div className="col-md-4 mb-4">
            {user && (
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient bg-primary text-white text-center py-3">
                  <h5 className="mb-0 fw-bold">Student Profile</h5>
                </div>

                {/* Body */}
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px", fontSize: "22px" }}>
                      {user.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="ms-3">
                      <h6 className="mb-0 fw-bold">{user.fullName}</h6>
                      <small className="text-muted">{user.accountType}</small>
                    </div>
                  </div>

                  <hr />

                  <p className="mb-2">
                    <strong>Email:</strong> <br />
                    <span className="text-muted">{user.email}</span>
                  </p>
                  <p className="mb-0">
                    <strong>College:</strong> <br />
                    <span className="text-muted">{user.college}</span>
                  </p>
                </div>
              </div>
            )}
          </div>


          {/* Right Side: Stats + Registrations */}
          <div className="col-md-8">
            {/* Stats */}
            <div className="row mb-3">
              {Object.entries(stats).map(([key, value]) => (
                <div className="col-6 col-md-3 mb-3" key={key}>
                  <div className="card text-center shadow-sm">
                    <div className="card-body">
                      <h6 className="text-muted">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </h6>
                      <h4>{value}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* My Registrations */}
            <div className="card border-0 shadow-lg rounded-4">
  {/* Header */}
  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
    <h5 className="mb-0 fw-bold">My Registrations</h5>
    <div>
      {["all", "approved", "pending", "rejected"].map(status => (
        <span
          key={status}
          className={`badge rounded-pill mx-1 ${
            filterStatus === status
              ? "bg-light text-primary fw-bold"
              : "bg-light text-muted"
          }`}
          style={{ cursor: "pointer", transition: "0.3s" }}
          onClick={() => setFilterStatus(status)}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ))}
    </div>
  </div>

  {/* Body */}
  <div className="card-body">
    {filteredRegs.length === 0 ? (
      <div className="text-center text-muted py-5">
        <p className="mb-3">You haven’t registered for any events yet.</p>
        <Link to="/events" className="btn btn-sm btn-primary shadow-sm">
          Browse Events
        </Link>
      </div>
    ) : (
      <div className="list-group">
        {filteredRegs.map(r => (
          <div
            key={r._id}
            className="list-group-item list-group-item-action mb-3 shadow-sm rounded-3 d-flex flex-column flex-md-row justify-content-between align-items-center transition-hover"
          >
            {/* Event Info */}
            <div className="mb-2 mb-md-0">
              <h6 className="mb-1 fw-bold">
                <Link
                  to={`/events/${r.event_id._id}`}
                  className="text-dark text-decoration-none"
                >
                  {r.event_id.title}
                </Link>
              </h6>
              <p className="text-muted mb-0 small">{r.event_id.category}</p>
              <p className="text-muted mb-0 small">
                {new Date(r.event_id.start_date).toDateString()} -{" "}
                {new Date(r.event_id.end_date).toDateString()}
              </p>
            </div>

            {/* Status Badge */}
            <div className="mb-2 mb-md-0 text-center">
              <span
                className={`badge px-3 py-2 ${
                  r.status === "approved"
                    ? "bg-success"
                    : r.status === "rejected"
                    ? "bg-danger"
                    : "bg-warning text-dark"
                }`}
                style={{ fontSize: "0.9rem" }}
              >
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2">
              {r.status === "pending" && (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={async () => {
                    if (!window.confirm("Cancel this registration?")) return;
                    try {
                      await api.delete(`/registrations/${r._id}`);
                      toast.success("Registration canceled");
                      setRegistrations(
                        registrations.filter(reg => reg._id !== r._id)
                      );
                    } catch (err) {
                      toast.error("Failed to cancel registration");
                    }
                  }}
                >
                  Cancel
                </button>
              )}
              {r.status === "approved" && (
  <button
    className="btn btn-sm btn-outline-success"
    onClick={() => downloadTicket(r._id, r.event_id.title)}
  >
    <FaFileDownload className="me-1" /> Ticket
  </button>
)}

            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

<style>
{`
.transition-hover {
  transition: transform 0.2s, box-shadow 0.2s;
}
.transition-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
}
`}
</style>


          </div>
        </div>
      )}

      {/* All Events Tab */}
      {tab === "allEvents" && (
        <>
          <h4 className="mb-3">All Events</h4>
          <div className="row">
            {events.length === 0 ? (
              <div className="col-12 text-center text-muted">
                No events available.
              </div>
            ) : (
              events.map(event => (
                <div key={event._id} className="col-md-4 mb-4">
                  <div className="card h-100 shadow-sm d-flex flex-column">
                    {event.banner && (
                      <img
                        src={event.banner}
                        alt={event.title}
                        className="card-img-top"
                        style={{ height: "160px", objectFit: "cover" }}
                      />
                    )}
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{event.title}</h5>
                      <p className="card-text text-muted">
                        <strong>Category:</strong> {event.category} <br />
                        <strong>Dates:</strong>{" "}
                        {new Date(
                          event.start_date
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          event.end_date
                        ).toLocaleDateString()}
                      </p>
                      <Link
                        to={`/events/${event._id}`}
                        className="btn btn-primary mt-auto btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default UserDashboard;

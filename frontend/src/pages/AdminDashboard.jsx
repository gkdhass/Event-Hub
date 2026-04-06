import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from "recharts";

function AdminDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    totalEvents: 0,
    activeUsers: 0,
    totalRegistrations: 0,
    pendingReviews: 0,
  });
  
  const [activeTab, setActiveTab] = useState("admin");
  const [profileData, setProfileData] = useState(null);

  const [activeTop, setActiveTop] = useState("Dashboard");
  const [activeSub, setActiveSub] = useState("Overview");

  const [filterStatus, setFilterStatus] = useState("all");
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);

  // Load all data
  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const profileRes = await api.get("/auth/profile");
      setProfileData(profileRes.data);

      // Fetch events, users, registrations, admin logs in parallel
      const [eventsRes, usersRes, regsRes, logsRes] = await Promise.all([
        api.get("/events?college=me"),
        api.get("/auth/"),
        api.get("/registrations"),
        api.get("/adminlogs/"),
      ]);

      setEvents(eventsRes.data);
      setUsers(usersRes.data);
      setRegistrations(regsRes.data);
      setAdminLogs(logsRes.data);

      // Update summary
      const pendingRegs = regsRes.data.filter(r => r.status === "pending");
      setSummary({
        totalEvents: eventsRes.data.length,
        activeUsers: usersRes.data.length,
        totalRegistrations: regsRes.data.length,
        pendingReviews: pendingRegs.length,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admin dashboard data");
    }
  };

  fetchDashboardData();
}, []);


  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

  // --- Render Overview ---
  const renderOverview = () => {
    const eventsByCategory = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});
    const pieData = Object.keys(eventsByCategory).map((key) => ({
      name: key,
      value: eventsByCategory[key],
    }));

    return (
      <div className="row">
        <div className="col-md-6 mb-4">
          <h6>Events by Category</h6>
          <PieChart width={350} height={300}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="col-md-6 mb-4">
          <h6>Registrations Status</h6>
          <BarChart
            width={350}
            height={300}
            data={[
              { name: "Approved", count: registrations.filter(r => r.status === "approved").length },
              { name: "Pending", count: registrations.filter(r => r.status === "pending").length },
              { name: "Rejected", count: registrations.filter(r => r.status === "rejected").length },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </div>
      </div>
    );
  };

  // --- User Management ---
const renderUserManagement = () => {

  const admins = users.filter((u) => u.accountType === "College Admin");
  const students = users.filter((u) => u.accountType !== "College Admin");

  return (
    <div className="shadow rounded-3 bg-light p-4 mt-3">
      <h5 className="text-primary fw-semibold mb-4 text-center">
        👥 User Management Dashboard
      </h5>

      {/* ===== Toggle Buttons ===== */}
      <div className="d-flex justify-content-center mb-4 gap-2">
        <button
          className={`btn btn-sm ${
            activeTab === "admin" ? "btn-danger" : "btn-outline-danger"
          }`}
          onClick={() => setActiveTab("admin")}
        >
          🏫 College Admin ({admins.length})
        </button>

        <button
          className={`btn btn-sm ${
            activeTab === "student" ? "btn-success" : "btn-outline-success"
          }`}
          onClick={() => setActiveTab("student")}
        >
          🎓 Students ({students.length})
        </button>
      </div>

      {/* ===== College Admin Table ===== */}
      {activeTab === "admin" && (
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle text-center mb-0">
            <thead className="table-danger">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {admins.length > 0 ? (
                admins.map((u, index) => (
                  <tr key={u._id}>
                    <td>{index + 1}</td>
                    <td className="fw-medium text-dark">{u.fullName}</td>
                    <td className="text-break">{u.email}</td>
                    <td>{u.college}</td>
                    <td>
                      <span className="badge bg-danger px-3 py-2 rounded-pill">
                        {u.accountType}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-muted py-3">
                    No college admins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Student Table ===== */}
      {activeTab === "student" && (
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle text-center mb-0">
            <thead className="table-success">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((u, index) => (
                  <tr key={u._id}>
                    <td>{index + 1}</td>
                    <td className="fw-medium text-dark">{u.fullName}</td>
                    <td className="text-break">{u.email}</td>
                    <td>{u.college}</td>
                    <td>
                      <span className="badge bg-success px-3 py-2 rounded-pill">
                        {u.accountType}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-muted py-3">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};




  // --- Event Management ---
  const renderEventManagement = () => (
    <div className="row">
      <div className="mb-3 text-end">
        <button
          className="btn btn-success"
          onClick={() => navigate("/create-event")}
        >
          + Add New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="col-12 text-center text-muted">No events available</div>
      ) : (
        events.map((event) => (
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
                <h5 className="card-title mb-2 text-primary fw-semibold">{event.title}</h5>
                <p className="card-text text-muted small mb-3">
                  <strong>Category:</strong> {event.category} <br />
                  <strong>Location:</strong> {event.location} <br />
                  <strong>Dates:</strong>{" "}
                  {new Date(event.start_date).toLocaleDateString()} –{" "}
                  {new Date(event.end_date).toLocaleDateString()}
                </p>

                <div className="mt-auto d-flex gap-1">
                  <button
                    className="btn btn-sm btn-primary flex-fill"
                    onClick={() => navigate(`/events/${event._id}`)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-sm btn-warning flex-fill"
                    onClick={() => navigate(`/events/${event._id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger flex-fill"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this event?")) {
                        try {
                          await api.delete(`/events/${event._id}`);
                          toast.success("Event deleted successfully");
                          setEvents(events.filter(e => e._id !== event._id));
                        } catch {
                          toast.error("Failed to delete event");
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))
      )}
    </div>
  );

  // --- Registrations ---
  const renderRegistrations = () => {
  const handleStatusChange = async (regId, status) => {
    try {
      await api.put(`/registrations/${regId}`, { status });
      toast.success(`Registration ${status}`);
      setRegistrations(
        registrations.map((r) => (r._id === regId ? { ...r, status } : r))
      );
    } catch (err) {
      toast.error("Failed to update registration");
    }
  };

  const handleCancel = async (regId) => {
  if (!window.confirm("Are you sure you want to cancel this registration?")) return;

  try {
    const res = await api.delete(`/registrations/${regId}`);
    toast.success(res.data.message || "Registration canceled successfully");
    setRegistrations((prev) => prev.filter((r) => r._id !== regId));
  } catch (err) {
    if (!err.response) {
      toast.error("Network error: Please check your connection.");
      return;
    }
    switch (err.response.status) {
      case 400:
        toast.error("Invalid registration ID.");
        break;
      case 403:
        toast.error("You are not authorized to cancel this registration.");
        break;
      case 404:
        toast.error("Registration not found.");
        break;
      default:
        toast.error(err.response.data.message || "Server error while canceling registration.");
    }
  }
};


  const filteredRegs = registrations.filter((r) =>
    filterStatus === "all" ? true : r.status === filterStatus
  );

  return (
    <div className="shadow rounded-3 bg-white p-4 mt-3">
      <h5 className="fw-bold text-center text-primary mb-4">
        📝 Event Registrations Dashboard
      </h5>

      {/* Filter Buttons */}
      <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
        {["all", "approved", "pending", "rejected"].map((status) => (
          <button
            key={status}
            className={`btn btn-sm px-3 py-1 ${
              filterStatus === status ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Registration Table */}
      <div className="table-responsive shadow-sm rounded-3 border">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-primary text-center">
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Email</th>
              <th>Event</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {filteredRegs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-muted py-3">
                  No registrations found
                </td>
              </tr>
            ) : (
              filteredRegs.map((r, index) => (
                <tr key={r._id}>
                  <td>{index + 1}</td>
                  <td className="fw-semibold text-dark">{r.user_id.fullName}</td>
                  <td className="text-break">{r.user_id.email}</td>
                  <td>{r.event_id.title}</td>
                  <td>
                    <span
                      className={`badge px-3 py-2 rounded-pill ${
                        r.status === "approved"
                          ? "bg-success"
                          : r.status === "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {r.status === "pending" && (
                      <>
                        <button
                          className="btn btn-sm btn-success me-1"
                          onClick={() => handleStatusChange(r._id, "approved")}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger me-1"
                          onClick={() => handleStatusChange(r._id, "rejected")}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCancel(r._id)}
                    >
                      🗑 Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};



  // --- Admin Logs ---
  const renderAdminLogs = () => (
  <div className="shadow rounded-3 bg-light p-4 mt-3">
    <h5 className="text-primary fw-semibold mb-4 text-center">
      🛠️ Admin Activity Logs
    </h5>

    <div className="table-responsive">
      <table className="table table-hover table-bordered align-middle mb-0">
        <thead className="table-secondary text-center">
          <tr>
            <th scope="col">#</th>
            <th scope="col">User</th>
            <th scope="col">Action</th>
            <th scope="col">Date</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {adminLogs.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-muted py-3">
                No admin logs available
              </td>
            </tr>
          ) : (
            adminLogs.map((log, index) => (
              <tr key={log._id}>
                <td className="text-muted small">{index + 1}</td>
                <td className="fw-medium text-dark">
                  {log.user_id?.fullName || "Unknown"}
                </td>
                <td>{log.action}</td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);


  const renderDashboardSub = () => {
    switch (activeSub) {
      case "Overview": return renderOverview();
      case "User Management": return renderUserManagement();
      case "Event Management": return renderEventManagement();
      case "Registrations": return renderRegistrations();
      case "Admin Logs": return renderAdminLogs();
      default: return <p>Select an option</p>;
    }
  };

  // --- Admin Panel ---
const renderAdminPanel = () => {
  return (
    <div className="shadow rounded-3 bg-light p-4 mt-3">
      <h5 className="text-primary fw-semibold mb-4 text-center">⚙️ Admin Control Panel</h5>

      <div className="row">
        {/* ===== Left: Admin Profile Section ===== */}
        <div className="col-md-4 mb-4">
          {profileData && (
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient bg-primary text-white text-center py-3">
                <h5 className="mb-0 fw-bold">Admin Profile</h5>
              </div>

              {/* Body */}
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                    style={{ width: "60px", height: "60px", fontSize: "22px" }}
                  >
                    {profileData.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-0 fw-bold">{profileData.fullName}</h6>
                    <small>{profileData.accountType}</small>
                  </div>
                </div>

                <hr />

                <p className="mb-2">
                  <strong>Email:</strong> <br />
                  <span className="text-muted">{profileData.email}</span>
                </p>
                <p className="mb-0">
                  <strong>College:</strong> <br />
                  <span className="text-muted">{profileData.college}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ===== Right: Summary Cards & Recent Actions ===== */}
        <div className="col-md-8">
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { icon: "bi-people-fill", title: "Total Users", count: users.length, color: "primary" },
              { icon: "bi-calendar-event-fill", title: "Total Events", count: events.length, color: "success" },
              { icon: "bi-clipboard-check-fill", title: "Total Registrations", count: registrations.length, color: "warning" },
              { icon: "bi-journal-text", title: "Admin Logs", count: adminLogs.length, color: "danger" }
            ].map((card, idx) => (
              <div className="col-sm-6 col-md-6 mb-3" key={idx}>
                <div className={`card text-center shadow-sm border-0 p-3`}>
                  <div className={`text-${card.color} fs-3 mb-2`}>
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <h6 className="text-muted">{card.title}</h6>
                  <p className="fw-bold fs-5 mb-0">{card.count}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Admin Actions */}
          <div className="mt-4">
            <h6 className="fw-semibold mb-3">🧾 Recent Admin Actions</h6>
            <div className="shadow-sm rounded" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <ul className="list-group">
                {adminLogs.length > 0 ? (
                  adminLogs.slice(0, 10).map((log) => (
                    <li
                      key={log._id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                      title={new Date(log.createdAt).toLocaleString()}
                    >
                      <span>
                        <strong className="text-dark">
                          {log.user_id?.fullName || "Unknown"}
                        </strong>{" "}
                        performed <em>{log.action}</em>
                      </span>
                      <small className="text-muted">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </small>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item text-center text-muted">
                    No recent admin actions
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




  return (
    <div className="container my-4">
      {/* --- Top Nav --- */}
      <div className="d-flex flex-wrap mb-4">
        {["All Events", "Dashboard", "Admin Panel"].map((t) => (
          <button
            key={t}
            className={`btn me-2 mb-2 ${activeTop === t ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveTop(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* --- Summary Cards --- */}
      {activeTop === "Dashboard" && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3"><div className="card text-center p-3 shadow"><h6>Total Events</h6><h2>{summary.totalEvents}</h2></div></div>
          <div className="col-md-3 mb-3"><div className="card text-center p-3 shadow"><h6>Active Users</h6><h2>{summary.activeUsers}</h2></div></div>
          <div className="col-md-3 mb-3"><div className="card text-center p-3 shadow"><h6>Total Registrations</h6><h2>{summary.totalRegistrations}</h2></div></div>
          <div className="col-md-3 mb-3"><div className="card text-center p-3 shadow"><h6>Pending Reviews</h6><h2>{summary.pendingReviews}</h2></div></div>
        </div>
      )}

      {/* --- Sub Navigation --- */}
      {activeTop === "Dashboard" && (
        <div className="d-flex flex-wrap mb-3">
          {["Overview", "User Management", "Event Management", "Registrations", "Admin Logs"].map((s) => (
            <button
              key={s}
              className={`btn me-2 mb-2 ${activeSub === s ? "btn-success" : "btn-outline-success"}`}
              onClick={() => setActiveSub(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* --- Content Area --- */}
      <div className="card shadow-sm p-4">
        {activeTop === "Dashboard" && renderDashboardSub()}
        {activeTop === "All Events" && renderEventManagement()}
        {activeTop === "Admin Panel" && renderAdminPanel()}
      </div>
    </div>
  );
}

export default AdminDashboard;

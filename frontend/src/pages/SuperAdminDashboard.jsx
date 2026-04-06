import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from "recharts";

// SuperAdminDashboard.jsx
// A single-file React component (Vite) that mirrors the AdminDashboard UI
// but with full "superadmin" capabilities: view/manage ALL events, users,
// registrations and admin logs. Includes search, pagination, bulk actions,
// CSV export, impersonation stub and optimistic UI updates.

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({ totalEvents: 0, activeUsers: 0, totalRegistrations: 0, pendingReviews: 0 });
  const [activeTop, setActiveTop] = useState("Dashboard");
  const [activeSub, setActiveSub] = useState("Overview");

  const [profileData, setProfileData] = useState(null);

  // core datasets (superadmin sees everything)
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);

  // UI helpers
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // bulk selection state for events & registrations & users
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [selectedRegistrations, setSelectedRegistrations] = useState(new Set());
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 9;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, eventsRes, usersRes, regsRes, logsRes] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/events"),             // superadmin: no college filter
          api.get("/auth"),              // all users
          api.get("/registrations"),     // all registrations
          api.get("/adminlogs"),         // all logs
        ]);

        setProfileData(profileRes.data);
        setEvents(eventsRes.data || []);
        setUsers(usersRes.data || []);
        setRegistrations(regsRes.data || []);
        setAdminLogs(logsRes.data || []);

        const pendingRegs = (regsRes.data || []).filter(r => r.status === "pending").length;
        setSummary({ totalEvents: (eventsRes.data || []).length, activeUsers: (usersRes.data || []).length, totalRegistrations: (regsRes.data || []).length, pendingReviews: pendingRegs });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load superadmin dashboard data");
      }
    };

    fetchAll();
  }, []);

  // ----------------- Utilities -----------------
  const exportCSV = (filename, rows) => {
    if (!rows || !rows.length) {
      toast.info("No data to export");
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} rows`);
  };

  const csvFromEvents = () => exportCSV("events.csv", events.map(e => ({ id: e._id, title: e.title, category: e.category, location: e.location, start_date: e.start_date, end_date: e.end_date })));
  const csvFromUsers = () => exportCSV("users.csv", users.map(u => ({ id: u._id, name: u.fullName, email: u.email, college: u.college, role: u.accountType })));
  const csvFromRegistrations = () => exportCSV("registrations.csv", registrations.map(r => ({ id: r._id, user: r.user_id?.fullName ?? r.user_id, email: r.user_id?.email ?? "-", event: r.event_id?.title ?? r.event_id, status: r.status })));

  // simple pagination helpers
  const paginated = (arr) => {
    const start = (page - 1) * perPage; return arr.slice(start, start + perPage);
  };

  // ----------------- Search & Filters -----------------
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(e => `${e.title} ${e.category} ${e.location} ${e.description || ""}`.toLowerCase().includes(q));
  }, [events, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => `${u.fullName} ${u.email} ${u.college} ${u.accountType}`.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const filteredRegs = useMemo(() => {
    const byStatus = filterStatus === "all" ? registrations : registrations.filter(r => r.status === filterStatus);
    if (!searchQuery) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter(r => `${r.user_id?.fullName || ""} ${r.user_id?.email || ""} ${r.event_id?.title || ""}`.toLowerCase().includes(q));
  }, [registrations, filterStatus, searchQuery]);

  // ----------------- Bulk actions -----------------
  const toggleSelectEvent = (id) => setSelectedEvents(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return new Set(s); });
  const toggleSelectReg = (id) => setSelectedRegistrations(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return new Set(s); });
  const toggleSelectUser = (id) => setSelectedUsers(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return new Set(s); });

  const bulkDeleteEvents = async () => {
    if (selectedEvents.size === 0) return toast.info("No events selected");
    if (!window.confirm(`Delete ${selectedEvents.size} events? This cannot be undone.`)) return;
    try {
      const ids = Array.from(selectedEvents);
      await api.post('/events/bulk-delete', { ids }); // endpoint expected on server
      setEvents(prev => prev.filter(e => !selectedEvents.has(e._id)));
      setSelectedEvents(new Set());
      toast.success("Events deleted");
    } catch (err) { console.error(err); toast.error("Bulk delete failed"); }
  };

  const bulkApproveRegs = async () => {
    if (selectedRegistrations.size === 0) return toast.info("No registrations selected");
    if (!window.confirm(`Approve ${selectedRegistrations.size} registrations?`)) return;
    try {
      const ids = Array.from(selectedRegistrations);
      await api.post('/registrations/bulk-update', { ids, status: 'approved' });
      setRegistrations(prev => prev.map(r => selectedRegistrations.has(r._id) ? { ...r, status: 'approved' } : r));
      setSelectedRegistrations(new Set());
      toast.success("Registrations approved");
    } catch (err) { console.error(err); toast.error("Bulk update failed"); }
  };

  // ----------------- Single actions -----------------
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(e => e._id !== eventId));
      toast.success("Event deleted");
    } catch (err) { console.error(err); toast.error("Failed to delete event"); }
  };

  const handleStatusChange = async (regId, status) => {
    try {
      await api.put(`/registrations/${regId}`, { status });
      setRegistrations(prev => prev.map(r => r._id === regId ? { ...r, status } : r));
      toast.success(`Registration ${status}`);
    } catch (err) { console.error(err); toast.error("Failed to update registration"); }
  };

  const handleCancel = async (regId) => {
    if (!window.confirm("Cancel this registration?")) return;
    try {
      await api.delete(`/registrations/${regId}`);
      setRegistrations(prev => prev.filter(r => r._id !== regId));
      toast.success("Registration canceled");
    } catch (err) { console.error(err); toast.error("Failed to cancel registration"); }
  };


  // ----------------- Renderers -----------------
  const renderOverview = () => {
    const eventsByCategory = events.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {});
    const pieData = Object.keys(eventsByCategory).map(k => ({ name: k, value: eventsByCategory[k] }));

    return (
      <div className="row">
        <div className="col-md-6 mb-4">
          <h6>Events by Category</h6>
          <PieChart width={350} height={300}>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {pieData.map((entry, index) => (<Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="col-md-6 mb-4">
          <h6>Registrations Status</h6>
          <BarChart width={350} height={300} data={[{ name: 'Approved', count: registrations.filter(r => r.status === 'approved').length }, { name: 'Pending', count: registrations.filter(r => r.status === 'pending').length }, { name: 'Rejected', count: registrations.filter(r => r.status === 'rejected').length }]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" />
          </BarChart>
        </div>
      </div>
    );
  };

  const renderUserManagement = () => {
    const admins = filteredUsers.filter(u => u.accountType === 'College Admin');
    const students = filteredUsers.filter(u => u.accountType !== 'College Admin');

    return (
      <div className="shadow rounded-3 bg-light p-4 mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-primary fw-semibold">👥 User Management</h5>
          <div>
            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => csvFromUsers()}>Export CSV</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(1)}>Reset Page</button>
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-center mb-3">
          <button className={`btn btn-sm ${activeSub === 'User Management' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setActiveSub('User Management')}>Users</button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle text-center mb-0">
            <thead className="table-info">
              <tr>
                <th><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedUsers(new Set(users.map(u => u._id))); else setSelectedUsers(new Set()); }} checked={selectedUsers.size === users.length && users.length > 0} /></th>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated(filteredUsers).length > 0 ? paginated(filteredUsers).map((u, i) => (
                <tr key={u._id}>
                  <td><input type="checkbox" checked={selectedUsers.has(u._id)} onChange={() => toggleSelectUser(u._id)} /></td>
                  <td>{(page - 1) * perPage + i + 1}</td>
                  <td className="fw-medium text-dark">{u.fullName}</td>
                  <td className="text-break">{u.email}</td>
                  <td>{u.college}</td>
                  <td><span className="badge bg-secondary px-3 py-2 rounded-pill">{u.accountType}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (!window.confirm('Delete user?')) return; try { await api.delete(`/auth/${u._id}`); setUsers(prev => prev.filter(x => x._id !== u._id)); toast.success('User deleted'); } catch { toast.error('Delete failed'); } }}>Delete</button>
                  </td>
                </tr>
              )) : (<tr><td colSpan="7" className="text-muted py-3">No users found</td></tr>)}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <button className="btn btn-sm btn-danger me-2" onClick={async () => {
              if (selectedUsers.size === 0) return toast.info('No users selected');
              if (!window.confirm(`Delete ${selectedUsers.size} users?`)) return;
              try { await api.post('/auth/bulk-delete', { ids: Array.from(selectedUsers) }); setUsers(prev => prev.filter(u => !selectedUsers.has(u._1d))); setSelectedUsers(new Set()); toast.success('Users deleted'); } catch (err) { console.error(err); toast.error('Bulk delete failed'); }
            }}>Bulk Delete</button>
          </div>

          <div>
            <small className="text-muted">Page {page}</small>
            <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
            <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    );
  };

  const renderEventManagement = () => (
    <div className="row">
      <div className="mb-3 text-end">
        <button className="btn btn-success me-2" onClick={() => navigate('/create-event')}>+ Add New Event</button>
        <button className="btn btn-outline-secondary" onClick={() => csvFromEvents()}>Export CSV</button>
      </div>

      {paginated(filteredEvents).length === 0 ? (
        <div className="col-12 text-center text-muted">No events available</div>
      ) : (
        paginated(filteredEvents).map((event) => (
          <div key={event._id} className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm d-flex flex-column">
              {event.banner && (<img src={event.banner} alt={event.title} className="card-img-top" style={{ height: '160px', objectFit: 'cover' }} />)}
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="card-title mb-2 text-primary fw-semibold">{event.title}</h5>
                  <input type="checkbox" checked={selectedEvents.has(event._id)} onChange={() => toggleSelectEvent(event._id)} />
                </div>

                <p className="card-text text-muted small mb-3"><strong>Category:</strong> {event.category} <br /><strong>Location:</strong> {event.location} <br /><strong>Dates:</strong> {new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}</p>

                <div className="mt-auto d-flex gap-1">
                  <button className="btn btn-sm btn-primary flex-fill" onClick={() => navigate(`/events/${event._id}`)}>View</button>
                  <button className="btn btn-sm btn-warning flex-fill" onClick={() => navigate(`/events/${event._id}/edit`)}>Edit</button>
                  <button className="btn btn-sm btn-danger flex-fill" onClick={() => handleDeleteEvent(event._id)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* bulk action footer */}
      <div className="col-12 my-3 d-flex justify-content-between align-items-center">
        <div>
          <button className="btn btn-sm btn-danger me-2" onClick={bulkDeleteEvents}>Delete Selected ({selectedEvents.size})</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedEvents(new Set()); toast.info('Selection cleared'); }}>Clear Selection</button>
        </div>

        <div>
          <small className="text-muted">Page {page}</small>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );

  const renderRegistrations = () => (
    <div className="shadow rounded-3 bg-white p-4 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-center text-primary mb-0">📝 Event Registrations</h5>
        <div>
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => csvFromRegistrations()}>Export CSV</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedRegistrations(new Set())}>Clear Selected</button>
        </div>
      </div>

      <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
        {['all', 'approved', 'pending', 'rejected'].map(s => (
          <button className={`btn btn-sm px-3 py-1 ${filterStatus === s ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilterStatus(s)} key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      <div className="table-responsive shadow-sm rounded-3 border">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-primary text-center">
            <tr>
              <th><input type="checkbox" onChange={(e) => { if (e.target.checked) setSelectedRegistrations(new Set(registrations.map(r => r._id))); else setSelectedRegistrations(new Set()); }} checked={selectedRegistrations.size === registrations.length && registrations.length > 0} /></th>
              <th>#</th>
              <th>Student</th>
              <th>Email</th>
              <th>Event</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {paginated(filteredRegs).length === 0 ? (
              <tr><td colSpan="7" className="text-muted py-3">No registrations found</td></tr>
            ) : (
              paginated(filteredRegs).map((r, i) => (
                <tr key={r._id}>
                  <td><input type="checkbox" checked={selectedRegistrations.has(r._id)} onChange={() => toggleSelectReg(r._id)} /></td>
                  <td>{(page - 1) * perPage + i + 1}</td>
                  <td className="fw-semibold text-dark">{r.user_id?.fullName}</td>
                  <td className="text-break">{r.user_id?.email}</td>
                  <td>{r.event_id?.title}</td>
                  <td><span className={`badge px-3 py-2 rounded-pill ${r.status === 'approved' ? 'bg-success' : r.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
                  <td>
                    {r.status === 'pending' && (<>
                      <button className="btn btn-sm btn-success me-1" onClick={() => handleStatusChange(r._id, 'approved')}>✅ Approve</button>
                      <button className="btn btn-sm btn-danger me-1" onClick={() => handleStatusChange(r._1d, 'rejected')}>❌ Reject</button>
                    </>)}
                    <button className="btn btn-sm btn-secondary" onClick={() => handleCancel(r._id)}>🗑 Cancel</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          <button className="btn btn-sm btn-success me-2" onClick={bulkApproveRegs}>Approve Selected ({selectedRegistrations.size})</button>
          <button className="btn btn-sm btn-danger" onClick={async () => {
            if (selectedRegistrations.size === 0) return toast.info('No registrations selected');
            if (!window.confirm(`Delete ${selectedRegistrations.size} registrations?`)) return;
            try { await api.post('/registrations/bulk-delete', { ids: Array.from(selectedRegistrations) }); setRegistrations(prev => prev.filter(r => !selectedRegistrations.has(r._id))); setSelectedRegistrations(new Set()); toast.success('Registrations deleted'); } catch (err) { console.error(err); toast.error('Bulk delete failed'); }
          }}>Delete Selected</button>
        </div>

        <div>
          <small className="text-muted">Page {page}</small>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );

  const renderAdminLogs = () => (
    <div className="shadow rounded-3 bg-light p-4 mt-3">
      <h5 className="text-primary fw-semibold mb-4 text-center">🛠️ Admin Activity Logs</h5>
      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle mb-0">
          <thead className="table-secondary text-center"><tr><th>#</th><th>User</th><th>Action</th><th>Date</th></tr></thead>
          <tbody className="text-center">{adminLogs.length === 0 ? (<tr><td colSpan="4" className="text-muted py-3">No admin logs available</td></tr>) : adminLogs.map((log, idx) => (<tr key={log._id}><td className="text-muted small">{idx+1}</td><td className="fw-medium text-dark">{log.user_id?.fullName || 'Unknown'}</td><td>{log.action}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboardSub = () => {
    switch (activeSub) {
      case 'Overview': return renderOverview();
      case 'User Management': return renderUserManagement();
      case 'Event Management': return renderEventManagement();
      case 'Registrations': return renderRegistrations();
      case 'Admin Logs': return renderAdminLogs();
      default: return <p>Select an option</p>;
    }
  };

  const renderAdminPanel = () => (
    <div className="shadow rounded-3 bg-light p-4 mt-3">
      <h5 className="text-primary fw-semibold mb-4 text-center">⚙️ Super Admin Control Panel</h5>
      <div className="row">
        <div className="col-md-4 mb-4">{profileData && (
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="bg-gradient bg-primary text-white text-center py-3"><h5 className="mb-0 fw-bold">Super Admin Profile</h5></div>
            <div className="card-body p-4"><div className="d-flex align-items-center mb-3"><div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, fontSize: 22 }}>{profileData.fullName?.charAt(0).toUpperCase()}</div><div className="ms-3"><h6 className="mb-0 fw-bold">{profileData.fullName}</h6><small>{profileData.accountType}</small></div></div><hr/><p className="mb-2"><strong>Email:</strong><br/><span className="text-muted">{profileData.email}</span></p><p className="mb-0"><strong>Scope:</strong><br/><span className="text-muted">Super Admin (full access)</span></p></div>
          </div>)}
        </div>

        <div className="col-md-8">
          <div className="row g-3 mb-4">{[
            { icon: 'bi-people-fill', title: 'Total Users', count: users.length, color: 'primary' },
            { icon: 'bi-calendar-event-fill', title: 'Total Events', count: events.length, color: 'success' },
            { icon: 'bi-clipboard-check-fill', title: 'Total Registrations', count: registrations.length, color: 'warning' },
            { icon: 'bi-journal-text', title: 'Admin Logs', count: adminLogs.length, color: 'danger' }
          ].map((card, idx) => (
            <div className="col-sm-6 col-md-6 mb-3" key={idx}><div className="card text-center shadow-sm border-0 p-3"><div className={`text-${card.color} fs-3 mb-2`}><i className={`bi ${card.icon}`}></i></div><h6 className="text-muted">{card.title}</h6><p className="fw-bold fs-5 mb-0">{card.count}</p></div></div>
          ))}</div>

          <div className="mt-4"><h6 className="fw-semibold mb-3">🧾 Recent Admin Actions</h6><div className="shadow-sm rounded" style={{ maxHeight: 300, overflowY: 'auto' }}><ul className="list-group">{adminLogs.length > 0 ? adminLogs.slice(0, 10).map(log => (<li key={log._id} className="list-group-item d-flex justify-content-between align-items-center" title={new Date(log.createdAt).toLocaleString()}><span><strong className="text-dark">{log.user_id?.fullName || 'Unknown'}</strong> performed <em>{log.action}</em></span><small className="text-muted">{new Date(log.createdAt).toLocaleDateString()}</small></li>)) : (<li className="list-group-item text-center text-muted">No recent admin actions</li>)}</ul></div></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container my-4">
      <div className="d-flex flex-wrap mb-4">
        {["All Events", "Dashboard", "Admin Panel"].map(t => (<button key={t} className={`btn me-2 mb-2 ${activeTop === t ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => { setActiveTop(t); setPage(1); }}>{t}</button>))}
      </div>

      {activeTop === 'Dashboard' && (<div className="row mb-4">{[<div className="col-md-3 mb-3" key={1}><div className="card text-center p-3 shadow"><h6>Total Events</h6><h2>{summary.totalEvents}</h2></div></div>,<div className="col-md-3 mb-3" key={2}><div className="card text-center p-3 shadow"><h6>Active Users</h6><h2>{summary.activeUsers}</h2></div></div>,<div className="col-md-3 mb-3" key={3}><div className="card text-center p-3 shadow"><h6>Total Registrations</h6><h2>{summary.totalRegistrations}</h2></div></div>,<div className="col-md-3 mb-3" key={4}><div className="card text-center p-3 shadow"><h6>Pending Reviews</h6><h2>{summary.pendingReviews}</h2></div></div>]}</div>)}

      {activeTop === 'Dashboard' && (<div className="d-flex flex-wrap mb-3"><input className="form-control me-2" style={{ maxWidth: 360 }} placeholder="Search events, users, registrations..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} /><div className="ms-2"><button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearchQuery(''); toast.info('Search cleared'); }}>Clear</button></div></div>)}

      {activeTop === 'Dashboard' && (<div className="d-flex flex-wrap mb-3">{["Overview", "User Management", "Event Management", "Registrations", "Admin Logs"].map(s => (<button key={s} className={`btn me-2 mb-2 ${activeSub === s ? 'btn-success' : 'btn-outline-success'}`} onClick={() => { setActiveSub(s); setPage(1); }}>{s}</button>))}</div>)}

      <div className="card shadow-sm p-4">{activeTop === 'Dashboard' && renderDashboardSub()}{activeTop === 'All Events' && renderEventManagement()}{activeTop === 'Admin Panel' && renderAdminPanel()}</div>
    </div>
  );
}

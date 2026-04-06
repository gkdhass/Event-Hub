import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

function ManageRegistrations() {
  const { eventId } = useParams();
  const [registrations, setRegistrations] = useState([]);

  const fetchRegs = async () => {
    try {
      const res = await api.get(`/registrations/event/${eventId}`);
      setRegistrations(res.data);
    } catch {
      toast.error("Failed to load registrations");
    }
  };

  useEffect(() => {
    fetchRegs();
  }, [eventId]);

  const handleStatus = async (id, status) => {
    try {
      await api.put("/registrations/manage", { registrationId: id, status });
      toast.success(`Marked as ${status}`);
      fetchRegs();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="container my-5">
      <h2>
        <i className="fa fa-users me-2"></i>Manage Registrations
      </h2>
      {registrations.length === 0 ? (
        <p>No registrations yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="table-dark">
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>College</th>
                <th>Status</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r._id}>
                  <td>{r.user_id.fullName}</td>
                  <td>{r.user_id.email}</td>
                  <td>{r.user_id.college}</td>
                  <td>{r.status}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() => handleStatus(r._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatus(r._id, "rejected")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageRegistrations;

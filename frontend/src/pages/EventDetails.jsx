import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaStar,
  FaInfoCircle,
} from "react-icons/fa";

// ---------------- Feedback Section ----------------
function FeedbackSection({ eventId }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [replyText, setReplyText] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchFeedbacks();
  }, [eventId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setCurrentUser(res.data);
    } catch {
      console.error("Failed to fetch profile");
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/feedbacks?eventId=${eventId}`);
      setFeedbacks(res.data);
      const avg =
        res.data.length > 0
          ? res.data.reduce((sum, f) => sum + f.rating, 0) / res.data.length
          : 0;
      setAvgRating(avg.toFixed(1));
    } catch {
      toast.error("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rating || !comment) {
      toast.error("Please provide both rating and comment");
      return;
    }

    try {
      await api.post("/feedbacks", { event_id: eventId, rating, comments: comment });
      toast.success("Feedback submitted!");
      setRating(0);
      setComment("");
      fetchFeedbacks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    }
  };

  const handleEdit = (fb) => {
    setEditingId(fb._id);
    setEditComment(fb.comments);
    setEditRating(fb.rating);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/feedbacks/${editingId}`, {
        rating: editRating,
        comments: editComment,
      });
      toast.success("Feedback updated!");
      setEditingId(null);
      fetchFeedbacks();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await api.delete(`/feedbacks/${id}`);
      toast.success("Feedback deleted!");
      fetchFeedbacks();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleReply = async (id) => {
    if (!replyText[id]) return toast.error("Reply cannot be empty");
    try {
      await api.post(`/feedbacks/${id}/replies`, { comment: replyText[id] });
      toast.success("Reply added!");
      setReplyText({ ...replyText, [id]: "" });
      fetchFeedbacks();
    } catch {
      toast.error("Failed to reply");
    }
  };

  // Sorting logic
  const sortedFeedbacks = [...feedbacks].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "lowest") return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = feedbacks.filter((f) => f.rating === star).length;
    return {
      star,
      count,
      percent: feedbacks.length ? (count / feedbacks.length) * 100 : 0,
    };
  });

  if (loading) return <p className="text-center text-muted">Loading feedbacks...</p>;

  return (
    <div className="card mt-5 p-4 shadow-sm w-100">
      <h3 className="fw-bold mb-3">Feedback & Reviews</h3>

      {avgRating > 0 ? (
        <div className="mb-4">
          <div className="d-flex align-items-center mb-2">
            <span className="fs-3 fw-bold me-2">{avgRating}</span>
            <div className="text-warning">
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.round(avgRating) ? "text-warning" : "text-secondary"}
                />
              ))}
            </div>
            <span className="ms-2 text-muted">({feedbacks.length} reviews)</span>
          </div>

          {/* Rating distribution */}
          {distribution.map((d) => (
            <div key={d.star} className="d-flex align-items-center mb-1">
              <span style={{ width: "40px" }}>{d.star}★</span>
              <div className="progress flex-grow-1 me-2" style={{ height: "8px" }}>
                <div className="progress-bar bg-warning" style={{ width: `${d.percent}%` }} />
              </div>
              <span>{d.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No reviews yet</p>
      )}

      {/* Submit feedback */}
      <div className="mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            onClick={() => setRating(star)}
            className={`me-1 cursor-pointer ${star <= rating ? "text-warning" : "text-secondary"}`}
            style={{ fontSize: "1.5rem" }}
          />
        ))}
      </div>

      <textarea
        className="form-control mb-3"
        rows="3"
        placeholder="Write your feedback..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button className="btn btn-primary mb-4" onClick={handleSubmit}>
        Submit Feedback
      </button>

      {/* Sort */}
      {feedbacks.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>What others say</h5>
          <select
            className="form-select w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      )}

      {/* Feedback cards */}
      <div className="row mt-3">
        {sortedFeedbacks.length > 0 ? (
          sortedFeedbacks.map((fb) => {
            const initials = fb.user_id?.fullName
              ? fb.user_id.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "U";

            const isOwner = fb.user_id?._id === currentUser?._id;
            const isAdmin = currentUser?.accountType === "College Admin";

            return (
              <div key={fb._id} className="col-lg-6 col-md-6 col-sm-12 mb-3">
                <div className="card p-3 shadow-sm h-100">
                  <div className="d-flex align-items-center mb-2">
                    {fb.user_id?.avatar ? (
                      <img
                        src={fb.user_id.avatar}
                        alt="avatar"
                        className="rounded-circle me-2"
                        style={{ width: "40px", height: "40px" }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: "40px", height: "40px" }}
                      >
                        {initials}
                      </div>
                    )}
                    <div>
                      <strong>{fb.user_id?.fullName || "Anonymous"}</strong>
                      <br />
                      <small className="text-muted">{fb.user_id?.college}</small>
                    </div>
                  </div>

                  {editingId === fb._id ? (
                    <>
                      <div className="mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            onClick={() => setEditRating(star)}
                            className={`me-1 cursor-pointer ${
                              star <= editRating ? "text-warning" : "text-secondary"
                            }`}
                          />
                        ))}
                      </div>
                      <textarea
                        className="form-control mb-2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                      />
                      <button className="btn btn-success btn-sm me-2" onClick={handleUpdate}>
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-warning mb-1 fs-3">
                        {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                      </div>
                      <p className="mb-2">{fb.comments}</p>

                      {(isOwner || isAdmin) && (
                        <div className="mb-2">
                          {isOwner && (
                            <button
                              className="btn btn-outline-primary btn-sm me-2"
                              onClick={() => handleEdit(fb)}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(fb._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* ✅ Replies Section */}
                  <div className="border-top pt-2 mt-2">
                    {fb.replies?.length > 0 &&
                      fb.replies.map((r, idx) => (
                        <div key={idx} className="ms-3 mb-2">
                          <strong>{r.user_id?.fullName || "Anonymous"}:</strong> {r.comment}
                        </div>
                      ))}
                    <div className="input-group mt-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Write a reply..."
                        value={replyText[fb._id] || ""}
                        onChange={(e) =>
                          setReplyText({ ...replyText, [fb._id]: e.target.value })
                        }
                      />
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleReply(fb._id)}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-muted">No feedback yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
}

// ---------------- Event Details Page ----------------
function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfileData(res.data);
      } catch {
        console.error("Failed to fetch profile");
      }
    };
    fetchProfile();
  }, []);

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);

        const regRes = await api.get("/registrations/me");
        const found = regRes.data.some((r) => r.event_id._id === id);
        setRegistered(found);
      } catch {
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      await api.post("/registrations", { event_id: id });
      toast.success("Registered successfully!");
      setRegistered(true);
    } catch {
      toast.error("Registration failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const myRegs = await api.get("/registrations/me");
      const reg = myRegs.data.find((r) => r.event_id._id === id);
      if (!reg) {
        toast.info("You are not registered for this event");
        setRegistered(false);
        return;
      }
      await api.delete(`/registrations/${reg._id}`);
      toast.success("Registration cancelled successfully");
      setRegistered(false);
    } catch {
      toast.error("Failed to cancel registration");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !profileData)
    return (
      <div className="container my-5 text-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );

  if (!event)
    return (
      <div className="container my-5 text-center">
        <h4>Event not found</h4>
      </div>
    );

  return (
    <div className="container my-5 d-flex flex-column align-items-center">
      <div className="card shadow-lg border-0 rounded-4 w-100" style={{ maxWidth: "1100px" }}>
        <div className="row g-0">
          {/* Banner */}
          {event.banner && (
            <div className="col-lg-6">
              <img
                src={event.banner}
                alt="Event Banner"
                className="img-fluid rounded-start h-100"
                style={{ objectFit: "cover", minHeight: "400px" }}
              />
            </div>
          )}

          {/* Event Details */}
          <div className="col-lg-6 d-flex flex-column p-5">
            <div className="flex-grow-1">
              <h1 className="fw-bold mb-4">{event.title}</h1>
              <div className="mb-4 d-flex flex-wrap gap-2">
                <span className="badge bg-primary px-3 py-2 fs-6">{event.category}</span>
                <span className="badge bg-secondary px-3 py-2 fs-6">
                  Organized by {event.college_id?.college || "College"}
                </span>
              </div>
              <p className="text-muted mb-4" style={{ lineHeight: "1.7" }}>
                {event.description}
              </p>

              <div className="mb-4">
                <p className="mb-3 fs-5 d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2 text-danger fs-4" /> {event.location}
                </p>
                <p className="mb-3 fs-5 d-flex align-items-center">
                  <FaCalendarAlt className="me-2 text-success fs-4" />
                  {new Date(event.start_date).toDateString()} –{" "}
                  {new Date(event.end_date).toDateString()}
                </p>
                <p className="fs-5 d-flex align-items-center">
                  <FaUser className="me-2 text-primary fs-4" />{" "}
                  {event.college_id?.college || "College"}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto">
              {profileData.accountType !== "College Admin" && profileData.accountType !== "Super Admin" ?  (
                !registered ? (
                  <button
                    className="btn btn-success btn-lg w-100 py-3 fw-semibold shadow-sm"
                    style={{
                      background: "linear-gradient(90deg, #28a745, #218838)",
                      border: "none",
                    }}
                    onClick={handleRegister}
                    disabled={actionLoading}
                  >
                    <FaCheck className="me-2" />{" "}
                    {actionLoading ? "Registering..." : "Register Now"}
                  </button>
                ) : (
                  <button
                    className="btn btn-danger btn-lg w-100 py-3 fw-semibold shadow-sm"
                    style={{
                      background: "linear-gradient(90deg, #dc3545, #c82333)",
                      border: "none",
                    }}
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    <FaTimes className="me-2" />{" "}
                    {actionLoading ? "Cancelling..." : "Cancel Registration"}
                  </button>
                )
              ) : (
                <div className="text-center text-muted">
                  <FaInfoCircle className="me-2" /> Registration is only for students
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div style={{ maxWidth: "1100px", width: "100%" }}>
        <FeedbackSection eventId={id} />
      </div>
    </div>
  );
}

export default EventDetails;

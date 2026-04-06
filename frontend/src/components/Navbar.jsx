import { Link, useNavigate, useLocation } from "react-router-dom";
import { removeToken, getToken } from "../services/auth";
import { toast } from "react-toastify";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const user = JSON.parse(localStorage.getItem("user")) || null;

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    toast.info("Logged out successfully");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top border-bottom">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold text-primary" to="/">
          <i className="fa-solid fa-calendar-days me-2"></i> CampusEventHub
        </Link>

        {/* Toggler (mobile) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Content */}
        <div className="collapse navbar-collapse" id="navbarContent">
          {/* Centered Links (Only if logged in) */}
          {token && (
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 text-center">
              <li className="nav-item mx-2 my-1">
                <Link
                  className={`btn ${isActive("/events")
                      ? "btn-primary text-white"
                      : "btn-outline-primary"
                    }`}
                  to="/events"
                >
                  <i className="fa fa-calendar me-1"></i> Events
                </Link>
              </li>
              <li className="nav-item mx-2 my-1">
                <Link
                  className={`btn ${isActive("/user-dashboard") ||
                      isActive("/admin-dashboard") ||
                      isActive("/superadmin-dashboard")
                      ? "btn-primary text-white"
                      : "btn-outline-primary"
                    }`}
                  to={
                    user?.accountType === "Student"
                      ? "/user-dashboard"
                      : user?.accountType === "College Admin"
                        ? "/admin-dashboard"
                        : user?.accountType === "Super Admin"
                          ? "/superadmin-dashboard"
                          : "/"
                  }
                >
                  <i className="fa fa-tachometer-alt me-1"></i> Dashboard
                </Link>
              </li>

            </ul>
          )}

          {/* Right Side (User Info if logged in) */}
          {token && (
            <div className="d-flex align-items-center flex-column flex-lg-row ms-lg-auto mt-3 mt-lg-0 text-center">
              <div className="d-flex align-items-center mb-2 mb-lg-0">
                <i className="fa fa-user-circle fa-2x text-primary me-2"></i>
                <div className="d-flex flex-column text-dark">
                  <span className="fw-bold">{user?.fullName}</span>
                  <small className="text-muted">{user?.accountType}</small>
                </div>
              </div>
              <button
                className="btn btn-outline-danger ms-lg-3 mt-2 mt-lg-0"
                onClick={handleLogout}
              >
                <i className="fa fa-sign-out-alt me-1"></i> Logout
              </button>
            </div>
          )}

          {/* If Not Logged In */}
          {!token && (
            <div className="d-flex flex-column flex-lg-row ms-lg-auto mt-3 mt-lg-0 text-center">
              <Link
                className="btn btn-outline-primary me-lg-2 mb-2 mb-lg-0"
                to="/login"
              >
                <i className="fa fa-sign-in-alt me-1"></i> Login
              </Link>
              <Link className="btn btn-primary mb-2 mb-lg-0" to="/register">
                <i className="fa fa-user-plus me-1"></i> Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Extra Styling */}
      <style>{`
        .navbar-brand {
          font-size: 1.25rem;
          transition: color 0.2s ease;
        }
        .navbar-brand:hover {
          color: #0d6efd !important;
        }
        .btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        @media (max-width: 991px) {
          .navbar-nav {
            flex-direction: column;
            align-items: center;
          }
          .d-flex.align-items-center.flex-column {
            margin-top: 1rem;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;

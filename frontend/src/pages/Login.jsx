import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { setToken } from "../services/auth";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserShield,
  FaUniversity,
  FaUserGraduate,
} from "react-icons/fa";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accountType: "Student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/signin", formData);

      setToken(res.data.token);
      localStorage.setItem("role", res.data.user.accountType);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login successful!");

      if (res.data.user.accountType === "Super Admin") {
        navigate("/superadmin-dashboard");
      } else if (res.data.user.accountType === "College Admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div
        className="card shadow-lg p-5"
        style={{ width: "420px", borderRadius: "15px" }}
      >
        {/* Icon */}
        <div className="text-center mb-3">
          <div
            className="d-inline-flex justify-content-center align-items-center rounded-circle"
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #1e3c72, #2a5298)",
              color: "white",
              fontSize: "28px",
            }}
          >
            <FaUserShield />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center mb-2"
          style={{
            background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold",
          }}
        >
          Welcome Back
        </h1>
        <p className="text-center text-muted mb-4">
          Sign in to your Campus Hub account
        </p>

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="mb-3 position-relative">
            <FaEnvelope
              className="position-absolute"
              style={{
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                color: "#6c757d",
              }}
            />
            <input
              type="email"
              name="email"
              className="form-control ps-5"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-3 position-relative">
            <FaLock
              className="position-absolute"
              style={{
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                color: "#6c757d",
              }}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-control ps-5 pe-5"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              className="position-absolute"
              style={{
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#6c757d",
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Account Type */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                {formData.accountType === "Super Admin" ? (
                  <FaUserShield />
                ) : formData.accountType === "College Admin" ? (
                  <FaUniversity />
                ) : (
                  <FaUserGraduate />
                )}
              </span>
              <select
                name="accountType"
                className="form-select border-start-0"
                value={formData.accountType}
                onChange={handleChange}
                required
              >
                <option value="Student">Student</option>
                <option value="College Admin">College Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="btn w-100 mb-3"
            style={{
              background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "50px",
              padding: "10px 0",
              boxShadow: "0 4px 10px rgba(78, 84, 200, 0.3)",
              transition: "0.3s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 6px 14px rgba(78, 84, 200, 0.5)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 4px 10px rgba(78, 84, 200, 0.3)")
            }
          >
            Sign In
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-muted">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-decoration-none"
            style={{ color: "#4e54c8", fontWeight: "bold" }}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

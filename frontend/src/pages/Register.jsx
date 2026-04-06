import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { setToken } from "../services/auth";
import { FaEnvelope, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    college: "",
    accountType: "Student",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/auth/signup", formData);

      setToken(res.data.token);
      localStorage.setItem("role", res.data.user.accountType);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Account created successfully!");
      navigate(
        res.data.user.accountType === "College Admin"
          ? "/admin-dashboard"
          : "/user-dashboard"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div
        className="card p-4 shadow-lg"
        style={{ width: "450px", borderRadius: "15px" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex justify-content-center align-items-center rounded-circle mb-3"
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #1e3c72, #2a5298)",
              color: "white",
              fontSize: "28px",
            }}
          >
            <FaEnvelope />
          </div>
          <h3 className="fw-bold mb-1">Welcome to Campus Hub</h3>
          <p className="text-muted mb-0">
            Sign up to join or create college events
          </p>
        </div>

        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div className="mb-3 position-relative">
            <FaUser className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              name="fullName"
              className="form-control ps-5 py-2 rounded-pill"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-3 position-relative">
            <FaEnvelope className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
            <input
              type="email"
              name="email"
              className="form-control ps-5 py-2 rounded-pill"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* College */}
          <div className="mb-3 position-relative">
            <FaUser className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              name="college"
              className="form-control ps-5 py-2 rounded-pill"
              placeholder="College Name"
              value={formData.college}
              onChange={handleChange}
              required
            />
          </div>

          {/* Account Type */}
          <div className="mb-3">
            <select
              name="accountType"
              className="form-control rounded-pill"
              value={formData.accountType}
              onChange={handleChange}
              required
            >
              <option value="Student">Student</option>
              <option value="College Admin">College Admin</option>
            </select>
          </div>

          {/* Password */}
          <div className="mb-3 position-relative">
            <FaLock className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-control ps-5 pe-5 py-2 rounded-pill"
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

          {/* Confirm Password */}
          <div className="mb-3 position-relative">
            <FaLock className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              className="form-control ps-5 pe-5 py-2 rounded-pill"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn w-100 py-2 mb-3 fw-bold"
            style={{
              background: "linear-gradient(135deg, #1e3c72, #2a5298)",
              color: "white",
              borderRadius: "50px",
              fontSize: "16px",
            }}
          >
            Register
          </button>
        </form>

        <p className="text-center mt-2 text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-primary fw-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

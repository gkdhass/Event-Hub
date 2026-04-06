import { Navigate } from "react-router-dom";
import { getToken } from "../services/auth";

const ProtectedRoute = ({ children, role }) => {
  const token = getToken();
  const userRole = localStorage.getItem("role");

  // 🔒 1. If no token, force login
  if (!token) return <Navigate to="/login" replace />;

  // ✅ 2. Super Admin always allowed
  if (userRole === "Super Admin") return children;

  // ✅ 3. If specific role required (like "College Admin" or "Student")
  if (role && userRole !== role) return <Navigate to="/" replace />;

  // ✅ 4. Otherwise, allow access
  return children;
};

export default ProtectedRoute;

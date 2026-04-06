const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Verify JWT and attach user
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ✅ Role-based access control (supports Super Admin)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized: user missing" });
    }

    console.log("🔍 Current user role:", req.user.accountType);
    console.log("✅ Allowed roles:", allowedRoles);

    // Check if user role is one of the allowed roles
    if (!allowedRoles.includes(req.user.accountType)) {
      return res
        .status(403)
        .json({ message: `Access denied for role: ${req.user.accountType}` });
    }

    next();
  };
};


module.exports = { protect, authorizeRoles };

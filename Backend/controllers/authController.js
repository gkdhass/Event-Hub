const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Signup (Create Account)
const signup = async (req, res) => {
  const { fullName, email, college, accountType, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({ fullName, email, college, accountType, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, user: { id: user._id, fullName, email, accountType } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Signin (Login)
const signin = async (req, res) => {
  const { email, password, accountType } = req.body;  // Account type for verification

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Optional: Verify account type matches
    if (user.accountType !== accountType) {
      return res.status(400).json({ message: 'Account type mismatch' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, fullName: user.fullName, email, accountType } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get logged-in user profile
const profile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user._id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Get users (filterable by accountType)
const listUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.accountType) {
      filter.accountType = req.query.accountType;
    }
    const users = await User.find(filter).select("-password"); // don’t send passwords
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { signup, signin, profile, listUsers, deleteUser  };
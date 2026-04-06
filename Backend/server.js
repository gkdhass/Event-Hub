const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminLogRoutes = require("./routes/adminLogRoutes");
const authRoutes = require("./routes/auth");

const app = express();

// ✅ CORS setup - updated with correct frontend URL
const allowedOrigins = [
  "https://event-hub-dun-mu.vercel.app",   // ← your actual frontend
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ MongoDB connection (works for both local + Vercel)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};

// ✅ CONNECT IMMEDIATELY (for local dev)
connectDB();

// ✅ ALSO ensure connection in serverless (Vercel)
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB();
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/adminlogs", adminLogRoutes);

app.get("/", (req, res) => {
  res.send("Campus EventHub API is running ✅");
});

// ✅ EXPORT for Vercel
module.exports = app;

// ✅ RUN SERVER ONLY IN LOCAL (NOT in Vercel)
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} 

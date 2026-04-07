const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminLogRoutes = require("./routes/adminLogRoutes");
const authRoutes = require("./routes/auth");

const app = express();

// ✅ CORS — updated with all frontend URLs
const allowedOrigins = [
  "https://gkeventhub.vercel.app",
  "https://event-hub-dun-mu.vercel.app",
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

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Found ✅" : "Missing ❌");
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/adminlogs", adminLogRoutes);

app.get("/", (req, res) => {
  res.send("Campus EventHub API is running ✅");
});

module.exports = app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
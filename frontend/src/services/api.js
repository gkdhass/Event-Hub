import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5000/api"               // 👈 local backend
      : import.meta.env.VITE_API_URL + "/api",    // 👈 Vercel backend URL from env variable
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

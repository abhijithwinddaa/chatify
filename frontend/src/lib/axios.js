import axios from "axios";

// Production backend URL - MUST match your Render backend
const PRODUCTION_API_URL = "https://chatify-backend-woz3.onrender.com";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api`
        : import.meta.env.MODE === "development"
            ? "http://localhost:3001/api"
            : `${PRODUCTION_API_URL}/api`,
    withCredentials: true,
})
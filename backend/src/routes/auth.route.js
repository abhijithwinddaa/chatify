import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
} from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProjection } from "../middleware/arcjet.middleware.js";

const route = express.Router();

route.use(arcjetProjection);

route.post("/signup", signup);

route.post("/login", login);

route.post("/logout", logout);

route.put("/update-profile", protectRoute, updateProfile);

route.get("/check", protectRoute, (req, res) => {
  res.status(200).json(req.user);
});

export default route;

import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
} from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProjection } from "../middleware/arcjet.middleware.js";
import passport from "../lib/passport.js";
import { generateToken } from "../lib/utils.js";
import { ENV } from "../lib/env.js";

const route = express.Router();

route.use(arcjetProjection);

route.post("/signup", signup);

route.post("/login", login);

route.post("/logout", logout);

route.put("/update-profile", protectRoute, updateProfile);

route.get("/check", protectRoute, (req, res) => {
  res.status(200).json(req.user);
});

// Google OAuth Routes
// Initiates the Google OAuth flow
route.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false
}));

// Google OAuth callback - handles the redirect from Google
route.get("/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${ENV.CLIENT_URL}/login?error=google_auth_failed`
  }),
  (req, res) => {
    // Generate JWT and set as cookie
    generateToken(req.user._id, res);

    // Redirect to frontend chat page
    res.redirect(`${ENV.CLIENT_URL}/chat`);
  }
);

export default route;


import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  deleteAccount,
} from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProjection } from "../middleware/arcjet.middleware.js";
import passport from "../lib/passport.js";
import { generateToken } from "../lib/utils.js";
import { ENV } from "../lib/env.js";

const route = express.Router();

// Apply arcjet only to specific routes (not Google OAuth)
route.post("/signup", arcjetProjection, signup);

route.post("/login", arcjetProjection, login);

route.post("/logout", logout);

route.put("/update-profile", protectRoute, updateProfile);

route.get("/check", protectRoute, (req, res) => {
  res.status(200).json(req.user);
});

// Delete account route - requires authentication
route.delete("/delete-account", protectRoute, deleteAccount);

// Google OAuth Routes (NO arcjet - it blocks OAuth redirects)
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


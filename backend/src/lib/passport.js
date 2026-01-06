import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { ENV } from "./env.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";

/**
 * Passport.js Configuration for Google OAuth 2.0
 * 
 * This sets up Google authentication strategy that:
 * 1. Authenticates users via Google OAuth
 * 2. Creates new user accounts for first-time Google sign-ins
 * 3. Links Google accounts if email already exists with local auth
 * 4. Returns existing user if Google account is already linked
 */

passport.use(
    new GoogleStrategy(
        {
            clientID: ENV.GOOGLE_CLIENT_ID,
            clientSecret: ENV.GOOGLE_CLIENT_SECRET,
            callbackURL: ENV.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Extract user info from Google profile
                const googleId = profile.id;
                const email = profile.emails[0].value;
                const fullName = profile.displayName;
                const profilePic = profile.photos[0]?.value || "";

                // Check if user already exists with this Google ID
                let user = await User.findOne({ googleId });

                if (user) {
                    // User already has Google account linked - log them in
                    return done(null, user);
                }

                // Check if user exists with same email (local account)
                user = await User.findOne({ email });

                if (user) {
                    // Link Google account to existing local account
                    user.googleId = googleId;
                    user.authProvider = user.password ? "local" : "google"; // Keep local if has password
                    if (!user.profilePic) {
                        user.profilePic = profilePic;
                    }
                    await user.save();
                    return done(null, user);
                }

                // Create new user with Google account
                const newUser = await User.create({
                    email,
                    fullName,
                    googleId,
                    profilePic,
                    authProvider: "google",
                });

                // Send welcome email for new Google users (non-blocking)
                try {
                    await sendWelcomeEmail(newUser.email, newUser.fullName, ENV.CLIENT_URL);
                    console.log("✅ Welcome email sent to Google user:", newUser.email);
                } catch (emailError) {
                    console.log("⚠️ Failed to send welcome email for Google user:", emailError.message);
                }

                return done(null, newUser);
            } catch (error) {
                console.error("Google OAuth error:", error);
                return done(error, null);
            }
        }
    )
);

// Serialize user for session (stores user ID in session)
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session (retrieves user by ID)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select("-password");
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;

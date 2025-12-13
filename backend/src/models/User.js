import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        minlength: 6,
        // Password is optional for Google OAuth users
    },
    profilePic: {
        type: String,
        default: "",
    },
    // Google OAuth specific fields
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Allows null values while maintaining uniqueness for non-null
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
},
    { timestamps: true }
); // createdAt & updatedAt 


const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
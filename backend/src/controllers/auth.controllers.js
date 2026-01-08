import { sendWelcomeEmail } from '../emails/emailHandlers.js'
import User from "../models/User.js";
import Message from "../models/Message.js";
import Group from "../models/Group.js";
import Poll from "../models/Poll.js";
import Notification from "../models/Notification.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import { ENV } from '../lib/env.js';
import cloudinary from '../lib/cloudinary.js';


export const signup = async (req, res) => {
    const { fullName, email, password } = req.body

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })

        }

        //chceck if email is vaild: regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const user = await User.findOne({ email })
        if (user) return res.status(400).json({ message: "Email already exists" })

        // 123456 => $fedc_hjsa@#@!%#  (hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        })

        if (newUser) {
            // generateToken(newUser._id, res);
            // await newUser.save();

            const savedUser = await newUser.save();
            generateToken(savedUser._id, res);

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })

            // tod0: send welcome email to user

            try {
                console.log("CLIENT_URL in signup:", ENV.CLIENT_URL);

                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL)
            } catch (error) {
                console.log("Failed to send welcome email:", error)
            }

        } else {
            res.status(400).json({ message: "Invalid user data" })
        }

    } catch (error) {
        console.error("error in signup:", error);
        res.status(400).json({ message: "Server error" })

    }

}

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ message: "Invalid Credentials" })

        // Check if user signed up with Google and doesn't have a password
        if (!user.password) {
            return res.status(400).json({
                message: "This account uses Google Sign-In. Please login with Google."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid Credentials" })

        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error("error in login:", error);
        res.status(400).json({ message: "Server error" })
    }
}

export const logout = (_, res) => {
    res.cookie("jwt", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: ENV.NODE_ENV === "production" ? "none" : "strict",
        secure: ENV.NODE_ENV !== "development"
    })
    res.status(200).json({ message: "Logged out successfully" })
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        if (!profilePic) return res.status(400).json({ message: "Profile picture is required." });

        const user = req.user._id;

        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        const updatedUser = await User.findByIdAndUpdate(user, { profilePic: uploadResponse.secure_url }, { new: true });

        res.status(200).json(updatedUser);


    } catch (error) {
        console.log("Error in updateProfile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Delete user account and all associated data
 * This is a destructive operation that cannot be undone
 */
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const userEmail = req.user.email;

        console.log(`🗑️ Starting account deletion for user: ${userEmail}`);

        // 1. Delete all notifications for/from this user
        const deletedNotifications = await Notification.deleteMany({
            $or: [
                { userId: userId },
                { fromUser: userId }
            ]
        });
        console.log(`  ✓ Deleted ${deletedNotifications.deletedCount} notifications`);

        // 2. Delete all polls created by this user
        const deletedPolls = await Poll.deleteMany({ createdBy: userId });
        console.log(`  ✓ Deleted ${deletedPolls.deletedCount} polls`);

        // 3. Remove user's votes from all polls
        await Poll.updateMany(
            { "options.votes": userId },
            { $pull: { "options.$[].votes": userId } }
        );
        console.log(`  ✓ Removed user's votes from polls`);

        // 4. Delete all direct messages sent or received by this user
        const deletedMessages = await Message.deleteMany({
            $or: [
                { senderId: userId, isGroupMessage: false },
                { receiverId: userId, isGroupMessage: false }
            ]
        });
        console.log(`  ✓ Deleted ${deletedMessages.deletedCount} direct messages`);

        // 5. Delete group messages sent by this user (or mark as deleted)
        await Message.updateMany(
            { senderId: userId, isGroupMessage: true },
            { $addToSet: { deletedFor: userId }, text: "[Message deleted]" }
        );
        console.log(`  ✓ Marked group messages as deleted`);

        // 6. Remove user from all group memberships
        await Group.updateMany(
            { members: userId },
            { $pull: { members: userId } }
        );
        console.log(`  ✓ Removed from all groups`);

        // 7. Handle groups where user is admin
        // Option: Delete groups or transfer admin to oldest member
        const adminGroups = await Group.find({ admin: userId });
        for (const group of adminGroups) {
            if (group.members.length > 0) {
                // Transfer admin to first remaining member
                const newAdmin = group.members[0];
                group.admin = newAdmin;
                await group.save();
                console.log(`  ✓ Transferred admin of "${group.name}" to another member`);
            } else {
                // No members left, delete the group
                await Group.findByIdAndDelete(group._id);
                // Also delete all messages in this group
                await Message.deleteMany({ groupId: group._id });
                console.log(`  ✓ Deleted empty group "${group.name}" and its messages`);
            }
        }

        // 8. Remove user's reactions from messages
        await Message.updateMany(
            { "reactions.userId": userId },
            { $pull: { reactions: { userId: userId } } }
        );
        console.log(`  ✓ Removed user's reactions`);

        // 9. Remove user from starredBy arrays
        await Message.updateMany(
            { starredBy: userId },
            { $pull: { starredBy: userId } }
        );
        console.log(`  ✓ Removed from starredBy`);

        // 10. Delete the user account
        await User.findByIdAndDelete(userId);
        console.log(`  ✓ Deleted user account`);

        // 11. Clear the JWT cookie (log them out)
        res.cookie("jwt", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: ENV.NODE_ENV === "production" ? "none" : "strict",
            secure: ENV.NODE_ENV !== "development"
        });

        console.log(`✅ Account deletion complete for: ${userEmail}`);

        res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        });

    } catch (error) {
        console.error("❌ Error in deleteAccount:", error);
        res.status(500).json({ message: "Failed to delete account. Please try again." });
    }
}
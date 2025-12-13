# CHATIFY-APP - Code Explanations

This document provides detailed explanations of all the new features implemented in the CHATIFY-APP.

---

## Table of Contents

1. [Landing Page](#1-landing-page)
2. [Account Page](#2-account-page)
3. [Read Receipts](#3-read-receipts)
4. [Typing Indicators](#4-typing-indicators)
5. [Google OAuth](#5-google-oauth)
6. [Group Chat](#6-group-chat)

---

## 1. Landing Page

**File:** `frontend/src/pages/LandingPage.jsx`

### Purpose
The landing page serves as the entry point for new visitors, showcasing the app's features and providing a clear call-to-action to start chatting.

### Key Components

```jsx
// Hero section with animated gradient text
<h1 className="text-6xl font-bold mb-6">
    <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
        Connect Instantly
    </span>
</h1>
```

**Explanation:** Uses CSS gradient with `bg-clip-text` and `text-transparent` to create a colorful gradient text effect.

```jsx
// "Let's Chat" button that redirects to login
<Link to="/login" className="bg-gradient-to-r from-cyan-500 to-cyan-600...">
    Let's Chat <ArrowRightIcon />
</Link>
```

**Explanation:** React Router's `Link` component navigates to `/login` without full page reload.

---

## 2. Account Page

**File:** `frontend/src/pages/AccountPage.jsx`

### Purpose
WhatsApp-like account management page where users can update their profile, see account info, and logout.

### Key Features

```jsx
// Profile picture upload with Cloudinary
const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Image = reader.result;
        await updateProfile({ profilePic: base64Image });
    };
};
```

**Explanation:** 
1. `FileReader` converts image to base64 string
2. Base64 is sent to backend which uploads to Cloudinary
3. Cloudinary URL is stored in database

```jsx
// Edit mode for full name
const [isEditing, setIsEditing] = useState(false);
```

**Explanation:** Toggle state controls whether input field or display text is shown.

---

## 3. Read Receipts

### Backend Changes

**File:** `backend/src/models/Message.js`

```javascript
status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
},
deliveredAt: { type: Date },
readAt: { type: Date },
```

**Explanation:** Three-state status tracking like WhatsApp - single tick (sent), double tick (delivered), blue double tick (read).

**File:** `backend/src/controllers/message.controller.js`

```javascript
export const markAsRead = async (req, res) => {
    const receiverId = req.user._id;
    const { senderId } = req.params;

    const result = await Message.updateMany(
        { senderId, receiverId, status: { $ne: "read" } },
        { $set: { status: "read", readAt: new Date() } }
    );

    // Notify sender via Socket.IO
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { receiverId: receiverId.toString() });
    }
};
```

**Explanation:**
1. `updateMany` updates all unread messages from sender to receiver
2. `getReceiverSocketId` finds the sender's socket connection
3. `io.to().emit()` sends real-time notification only to that sender

### Frontend Changes

**File:** `frontend/src/components/MessageStatus.jsx`

```jsx
const statusConfig = {
    sent: { icon: <CheckIcon />, color: "text-slate-400" },      // Single gray tick
    delivered: { icon: <CheckCheckIcon />, color: "text-slate-400" }, // Double gray ticks
    read: { icon: <CheckCheckIcon />, color: "text-cyan-400" },  // Double blue ticks
};
```

**Explanation:** Maps status to visual representation using Lucide icons and Tailwind colors.

---

## 4. Typing Indicators

### Backend Changes

**File:** `backend/src/lib/socket.js`

```javascript
socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { userId: socket.userId });
    }
});
```

**Explanation:** 
1. Client emits `typing` event with target user's ID
2. Server looks up target's socket ID in `userSocketMap`
3. Server emits `userTyping` directly to that socket only

### Frontend Changes

**File:** `frontend/src/components/MessageInput.jsx`

```javascript
let typingTimeoutRef = null;

const handleTyping = () => {
    emitTyping(selectedUser._id);
    
    if (typingTimeoutRef) clearTimeout(typingTimeoutRef);
    
    typingTimeoutRef = setTimeout(() => {
        emitStopTyping(selectedUser._id);
    }, 2000);
};
```

**Explanation:**
1. `typingTimeoutRef` persists across renders (declared outside component)
2. Each keystroke resets the 2-second timer
3. After 2 seconds of no typing, `stopTyping` is emitted
4. This prevents flooding the server with rapid typing events

**File:** `frontend/src/components/TypingIndicator.jsx`

```jsx
<span className="animate-bounce" style={{ animationDelay: "0ms" }} />
<span className="animate-bounce" style={{ animationDelay: "150ms" }} />
<span className="animate-bounce" style={{ animationDelay: "300ms" }} />
```

**Explanation:** Three dots with staggered animation delays create the classic "typing..." wave effect.

---

## 5. Google OAuth

### Backend Setup

**File:** `backend/src/lib/passport.js`

```javascript
passport.use(new GoogleStrategy({
    clientID: ENV.GOOGLE_CLIENT_ID,
    clientSecret: ENV.GOOGLE_CLIENT_SECRET,
    callbackURL: ENV.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    // Check if user exists by Google ID
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);
    
    // Check if email exists (link accounts)
    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
    }
    
    // Create new user
    const newUser = await User.create({
        email: profile.emails[0].value,
        fullName: profile.displayName,
        googleId: profile.id,
        profilePic: profile.photos[0]?.value,
        authProvider: "google",
    });
    return done(null, newUser);
}));
```

**Explanation:**
1. **GoogleStrategy** handles OAuth 2.0 flow with Google
2. Three scenarios handled:
   - User has Google ID → log them in
   - User has same email → link Google account to existing account
   - New user → create account with Google info
3. `done(null, user)` signals successful authentication

**File:** `backend/src/routes/auth.route.js`

```javascript
route.get("/google", passport.authenticate("google", { 
    scope: ["profile", "email"],
    session: false 
}));

route.get("/google/callback", 
    passport.authenticate("google", { session: false }),
    (req, res) => {
        generateToken(req.user._id, res);
        res.redirect(`${ENV.CLIENT_URL}/chat`);
    }
);
```

**Explanation:**
1. `/google` initiates OAuth flow, requesting user's profile and email
2. `/google/callback` receives Google's response
3. On success: generates JWT cookie and redirects to chat page
4. `session: false` because we use JWT instead of sessions

### Frontend Implementation

```jsx
<a href={`${import.meta.env.VITE_API_URL}/api/auth/google`}>
    <svg><!-- Google Logo SVG --></svg>
    Continue with Google
</a>
```

**Explanation:** Simple anchor tag redirects to backend OAuth endpoint - no complex client-side SDK needed.

---

## 6. Group Chat

### Database Schema

**File:** `backend/src/models/Group.js`

```javascript
const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    groupPic: { type: String, default: "" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maxMembers: { type: Number, default: 50, max: 250 },
}, { timestamps: true });

groupSchema.index({ members: 1 });
```

**Explanation:**
- `admin` is the creator with special permissions (update/delete group, add/remove members)
- `members` array includes admin and all other participants
- `maxMembers` enforces 50-member limit (expandable to 250)
- `index` on `members` speeds up "find user's groups" queries

**File:** `backend/src/models/Message.js` (updated)

```javascript
groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
isGroupMessage: { type: Boolean, default: false },
receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Now optional
```

**Explanation:** Messages can now be either:
- Direct messages: `receiverId` set, `groupId` null
- Group messages: `groupId` set, `receiverId` null

### Controller Highlights

**File:** `backend/src/controllers/group.controller.js`

```javascript
export const sendGroupMessage = async (req, res) => {
    // Verify sender is member
    if (!group.members.some(m => m.toString() === senderId.toString())) {
        return res.status(403).json({ message: "Not a member" });
    }
    
    // Create message
    const newMessage = await Message.create({
        senderId,
        groupId: id,
        isGroupMessage: true,
        text,
        image: imageUrl,
    });
    
    // Notify all OTHER members
    group.members.forEach(memberId => {
        if (memberId.toString() !== senderId.toString()) {
            const socketId = getReceiverSocketId(memberId.toString());
            if (socketId) {
                io.to(socketId).emit("newGroupMessage", { groupId: id, message: populatedMessage });
            }
        }
    });
};
```

**Explanation:**
1. Authorization check ensures only members can send
2. Message created with `isGroupMessage: true`
3. Socket notification sent to all members EXCEPT sender
4. `forEach` iterates through all members individually

### Frontend Store

**File:** `frontend/src/store/useGroupStore.js`

```javascript
subscribeToGroups: () => {
    socket.on("newGroup", (group) => {
        set({ groups: [group, ...get().groups] });
    });
    
    socket.on("newGroupMessage", ({ groupId, message }) => {
        if (get().selectedGroup?._id === groupId) {
            set({ groupMessages: [...get().groupMessages, message] });
        }
    });
    
    socket.on("removedFromGroup", ({ groupId }) => {
        set({
            groups: get().groups.filter(g => g._id !== groupId),
            selectedGroup: null
        });
        toast.info("You were removed from a group");
    });
},
```

**Explanation:**
1. `newGroup` adds newly created group to list
2. `newGroupMessage` only updates if viewing that group (prevents wrong messages appearing)
3. `removedFromGroup` removes group from local state and clears selection

---

## Environment Variables Required

### Backend `.env`

```env
# Existing variables...

# Google OAuth (NEW)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:3000
```

---

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Google+ API** and **Google OAuth 2.0**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Select **Web Application**
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - Your production URL
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - Your production callback URL
8. Copy Client ID and Client Secret to `.env`

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `frontend/src/pages/LandingPage.jsx` | Welcome page with features showcase |
| `frontend/src/pages/AccountPage.jsx` | Profile management page |
| `frontend/src/components/MessageStatus.jsx` | Read receipt tick indicators |
| `frontend/src/components/TypingIndicator.jsx` | Animated typing dots |
| `frontend/src/components/GroupList.jsx` | Displays user's groups |
| `frontend/src/components/GroupChatContainer.jsx` | Group message view |
| `frontend/src/components/CreateGroupModal.jsx` | Group creation dialog |
| `frontend/src/store/useGroupStore.js` | Group state management |
| `backend/src/models/Group.js` | Group database schema |
| `backend/src/controllers/group.controller.js` | Group API logic |
| `backend/src/routes/group.route.js` | Group API endpoints |
| `backend/src/lib/passport.js` | Google OAuth configuration |

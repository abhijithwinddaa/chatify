import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { ArrowLeftIcon, CameraIcon, Loader2Icon, MailIcon, CalendarIcon, UserIcon, LogOutIcon, Trash2Icon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import toast from "react-hot-toast";

function AccountPage() {
    const { authUser, updateProfile, isUpdatingProfile, logout } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(authUser?.fullName || "");
    const [selectedImg, setSelectedImg] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Image = reader.result;
            setSelectedImg(base64Image);
            await updateProfile({ profilePic: base64Image });
        };
    };

    const handleSaveName = async () => {
        if (fullName.trim() === authUser.fullName) {
            setIsEditing(false);
            return;
        }

        if (fullName.trim().length < 2) {
            toast.error("Name must be at least 2 characters");
            return;
        }

        // TODO: Add updateName API call - for now just show toast
        toast.success("Name update coming soon!");
        setIsEditing(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="w-full max-w-2xl relative z-10">
            <BorderAnimatedContainer>
                <div className="w-full p-8 bg-slate-800/50 backdrop-blur-sm">
                    {/* HEADER */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            to="/chat"
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-200">Account</h1>
                    </div>

                    {/* PROFILE PICTURE SECTION */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500/30">
                                <img
                                    src={selectedImg || authUser?.profilePic || "/avatar.png"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUpdatingProfile}
                                className="absolute bottom-0 right-0 bg-cyan-500 p-3 rounded-full hover:bg-cyan-600 transition-colors disabled:opacity-50"
                            >
                                {isUpdatingProfile ? (
                                    <Loader2Icon className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <CameraIcon className="w-5 h-5 text-white" />
                                )}
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                        <p className="text-slate-400 text-sm mt-3">
                            Click the camera icon to update your photo
                        </p>
                    </div>

                    {/* PROFILE INFO SECTION */}
                    <div className="space-y-4">
                        {/* NAME */}
                        <div className="bg-slate-700/30 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="w-5 h-5 text-cyan-400" />
                                    <span className="text-slate-400 text-sm">Name</span>
                                </div>
                                <button
                                    onClick={() => isEditing ? handleSaveName() : setIsEditing(true)}
                                    className="text-cyan-400 text-sm hover:text-cyan-300"
                                >
                                    {isEditing ? "Save" : "Edit"}
                                </button>
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="mt-2 w-full bg-slate-800/50 border border-slate-600 rounded-lg py-2 px-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    autoFocus
                                />
                            ) : (
                                <p className="text-slate-200 text-lg mt-1">{authUser?.fullName}</p>
                            )}
                        </div>

                        {/* EMAIL */}
                        <div className="bg-slate-700/30 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <MailIcon className="w-5 h-5 text-cyan-400" />
                                <span className="text-slate-400 text-sm">Email</span>
                            </div>
                            <p className="text-slate-200 text-lg mt-1">{authUser?.email}</p>
                        </div>

                        {/* MEMBER SINCE */}
                        <div className="bg-slate-700/30 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                                <span className="text-slate-400 text-sm">Member Since</span>
                            </div>
                            <p className="text-slate-200 text-lg mt-1">
                                {authUser?.createdAt ? formatDate(authUser.createdAt) : "Unknown"}
                            </p>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-slate-700/50 text-slate-300 py-3 rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            <LogOutIcon className="w-5 h-5" />
                            Logout
                        </button>

                        <button
                            className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 py-3 rounded-xl hover:bg-red-500/20 transition-colors"
                            onClick={() => toast.error("Delete account feature coming soon!")}
                        >
                            <Trash2Icon className="w-5 h-5" />
                            Delete Account
                        </button>
                    </div>
                </div>
            </BorderAnimatedContainer>
        </div>
    );
}

export default AccountPage;

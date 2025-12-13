import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, VolumeOffIcon, Volume2Icon, LogOutIcon, UserIcon, MoreVerticalIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
    const { logout, authUser } = useAuthStore();
    const { isSoundEnabled, toggleSound } = useChatStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAccountClick = () => {
        setIsMenuOpen(false);
        navigate("/account");
    };

    const handleLogout = () => {
        setIsMenuOpen(false);
        logout();
    };

    return (
        <div className='p-4 border-b border-slate-700/50'>
            <div className='flex items-center justify-between'>
                {/* LEFT: USER INFO */}
                <div className='flex items-center gap-3'>
                    {/* AVATAR */}
                    <div className="avatar online">
                        <div className="size-12 rounded-full overflow-hidden">
                            <img
                                src={authUser.profilePic || "/avatar.png"}
                                alt="User image"
                                className="size-full object-cover"
                            />
                        </div>
                    </div>

                    {/* USERNAME & ONLINE TEXT */}
                    <div>
                        <h3 className="text-slate-200 font-medium text-base max-w-[120px] truncate">
                            {authUser.fullName}
                        </h3>
                        <p className="text-green-500 text-xs">Online</p>
                    </div>
                </div>

                {/* RIGHT: ACTION BUTTONS */}
                <div className="flex gap-2 items-center">
                    {/* SOUND TOGGLE BTN */}
                    <button
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all"
                        onClick={() => {
                            mouseClickSound.currentTime = 0;
                            mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
                            toggleSound();
                        }}
                        title={isSoundEnabled ? "Mute sounds" : "Unmute sounds"}
                    >
                        {isSoundEnabled ? (
                            <Volume2Icon className="size-5" />
                        ) : (
                            <VolumeOffIcon className="size-5" />
                        )}
                    </button>

                    {/* SETTINGS DROPDOWN */}
                    <div className="relative" ref={menuRef}>
                        <button
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            title="Menu"
                        >
                            <MoreVerticalIcon className="size-5" />
                        </button>

                        {/* DROPDOWN MENU */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                {/* Account Option */}
                                <button
                                    onClick={handleAccountClick}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-slate-700 transition-colors text-left"
                                >
                                    <UserIcon className="size-5 text-slate-400" />
                                    <span>Account</span>
                                </button>

                                {/* Settings Option */}
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        navigate("/account");
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-slate-700 transition-colors text-left"
                                >
                                    <SettingsIcon className="size-5 text-slate-400" />
                                    <span>Settings</span>
                                </button>

                                {/* Divider */}
                                <div className="border-t border-slate-700"></div>

                                {/* Logout Option */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-700 transition-colors text-left"
                                >
                                    <LogOutIcon className="size-5" />
                                    <span>Log out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfileHeader

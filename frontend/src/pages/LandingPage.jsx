import { Link } from "react-router";
import { MessageCircleIcon, UsersIcon, ShieldCheckIcon, ZapIcon, ArrowRightIcon } from "lucide-react";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

function LandingPage() {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        // Load animation data from local public folder
        fetch("/chat-animation.json")
            .then(response => response.json())
            .then(data => setAnimationData(data))
            .catch(err => console.log("Animation load error:", err));
    }, []);

    return (
        <div className="w-full max-w-6xl relative z-10">
            {/* HERO SECTION */}
            <div className="flex flex-col lg:flex-row items-center gap-8 mb-16">
                {/* LEFT - TEXT CONTENT */}
                <div className="flex-1 text-center lg:text-left">
                    {/* LOGO & BADGE */}
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                        <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                            Chatify
                        </span>
                    </div>

                    {/* HERO TEXT */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                        Connect with Anyone,
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                            Anywhere, Anytime
                        </span>
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-8">
                        Experience seamless real-time messaging with friends, family, and colleagues.
                        Fast, secure, and beautifully designed.
                    </p>

                    {/* CTA BUTTON */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105"
                    >
                        Let's Chat
                        <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                </div>

                {/* RIGHT - LOTTIE ANIMATION */}
                <div className="flex-1 flex justify-center items-center">
                    <div className="w-80 h-80 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px]">
                        {animationData && (
                            <Lottie
                                animationData={animationData}
                                loop={true}
                                autoplay={true}
                                style={{ width: "100%", height: "100%" }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* FEATURES GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {/* FEATURE 1 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                        <MessageCircleIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Real-time Chat</h3>
                    <p className="text-slate-400 text-sm">
                        Instant message delivery with typing indicators and read receipts.
                    </p>
                </div>

                {/* FEATURE 2 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                        <UsersIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Group Chats</h3>
                    <p className="text-slate-400 text-sm">
                        Create groups with up to 50 members and share moments together.
                    </p>
                </div>

                {/* FEATURE 3 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                        <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Secure & Private</h3>
                    <p className="text-slate-400 text-sm">
                        Your conversations are protected with industry-standard security.
                    </p>
                </div>

                {/* FEATURE 4 */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                        <ZapIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Lightning Fast</h3>
                    <p className="text-slate-400 text-sm">
                        Optimized for speed with instant loading and smooth animations.
                    </p>
                </div>
            </div>

            {/* FOOTER */}
            <div className="text-center mt-16 text-slate-500 text-sm">
                <p>Made with ❤️ by Abhijith</p>
            </div>
        </div>
    );
}

export default LandingPage;

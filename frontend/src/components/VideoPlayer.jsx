import { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon, MaximizeIcon, Volume2Icon, VolumeXIcon } from "lucide-react";

/**
 * VideoPlayer Component
 * 
 * A custom video player for video messages with:
 * - Play/Pause control
 * - Progress bar
 * - Duration display
 * - Fullscreen toggle
 * - Mute toggle
 * - Thumbnail preview
 */
function VideoPlayer({ src, thumbnail, duration: initialDuration }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialDuration || 0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        video.addEventListener("timeupdate", updateTime);
        video.addEventListener("loadedmetadata", updateDuration);
        video.addEventListener("ended", handleEnded);

        return () => {
            video.removeEventListener("timeupdate", updateTime);
            video.removeEventListener("loadedmetadata", updateDuration);
            video.removeEventListener("ended", handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleMute = () => {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
        if (videoRef.current.requestFullscreen) {
            videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
            videoRef.current.webkitRequestFullscreen();
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleMouseEnter = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
    };

    const handleMouseLeave = () => {
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 2000);
        }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className="relative rounded-lg overflow-hidden bg-black min-w-[200px] max-w-[300px] group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                src={src}
                poster={thumbnail}
                preload="metadata"
                className="w-full aspect-video object-cover cursor-pointer"
                onClick={togglePlay}
            />

            {/* Play button overlay */}
            {!isPlaying && (
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                    <div className="w-12 h-12 flex items-center justify-center bg-cyan-500 rounded-full">
                        <PlayIcon className="w-6 h-6 text-white ml-1" />
                    </div>
                </button>
            )}

            {/* Controls overlay */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"
                    }`}
            >
                {/* Progress bar */}
                <div
                    className="h-1 bg-slate-600 rounded-full cursor-pointer mb-2"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <button onClick={togglePlay} className="hover:text-cyan-400 transition-colors">
                            {isPlaying ? (
                                <PauseIcon className="w-4 h-4" />
                            ) : (
                                <PlayIcon className="w-4 h-4" />
                            )}
                        </button>
                        <span className="text-xs">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className="hover:text-cyan-400 transition-colors">
                            {isMuted ? (
                                <VolumeXIcon className="w-4 h-4" />
                            ) : (
                                <Volume2Icon className="w-4 h-4" />
                            )}
                        </button>
                        <button onClick={toggleFullscreen} className="hover:text-cyan-400 transition-colors">
                            <MaximizeIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;

import { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon } from "lucide-react";

/**
 * AudioPlayer Component
 * 
 * A custom audio player for voice messages with:
 * - Play/Pause control
 * - Progress bar
 * - Duration display
 */
function AudioPlayer({ src, duration: initialDuration }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialDuration || 0);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-2 min-w-[180px]">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause button */}
            <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors flex-shrink-0"
            >
                {isPlaying ? (
                    <PauseIcon className="w-4 h-4" />
                ) : (
                    <PlayIcon className="w-4 h-4 ml-0.5" />
                )}
            </button>

            {/* Progress bar */}
            <div className="flex-1 flex flex-col gap-1">
                <div
                    className="h-1.5 bg-slate-600 rounded-full cursor-pointer overflow-hidden"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Time display */}
                <div className="flex justify-between text-xs text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}

export default AudioPlayer;

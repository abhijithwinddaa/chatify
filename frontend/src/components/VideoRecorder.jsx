import { useState, useRef, useEffect } from "react";
import { VideoIcon, StopCircleIcon, XIcon, SendIcon, SwitchCameraIcon } from "lucide-react";

/**
 * VideoRecorder Component
 * 
 * Records video using MediaRecorder API and provides:
 * - Camera preview
 * - Recording start/stop control
 * - Duration timer
 * - Video preview and playback
 * - Send/Cancel options
 */
function VideoRecorder({ onSend, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [videoBlob, setVideoBlob] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [error, setError] = useState(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState("user"); // "user" or "environment"

    const mediaRecorderRef = useRef(null);
    const videoChunksRef = useRef([]);
    const timerRef = useRef(null);
    const previewRef = useRef(null);
    const playbackRef = useRef(null);

    // Start camera preview on mount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [facingMode]);

    // Format duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const startCamera = async () => {
        try {
            setError(null);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode },
                audio: true
            });

            setStream(newStream);
            if (previewRef.current) {
                previewRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please allow camera permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    const startRecording = () => {
        if (!stream) return;

        videoChunksRef.current = [];
        setDuration(0);
        setVideoBlob(null);
        setVideoUrl(null);

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp9,opus"
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                videoChunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
            setVideoBlob(blob);
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        };

        mediaRecorder.start(100);
        setIsRecording(true);

        // Start duration timer
        timerRef.current = setInterval(() => {
            setDuration(prev => {
                // Max 60 seconds for video messages
                if (prev >= 60) {
                    stopRecording();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setIsRecording(false);
    };

    const handleCancel = () => {
        stopRecording();
        stopCamera();
        setDuration(0);
        setVideoBlob(null);
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        onCancel();
    };

    const handleSend = async () => {
        if (!videoBlob) return;

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            onSend(reader.result, duration);
            handleCancel();
        };
        reader.readAsDataURL(videoBlob);
    };

    return (
        <div className="flex flex-col gap-3 bg-slate-800/80 rounded-lg p-4 border border-slate-700/50">
            {error ? (
                <div className="text-red-400 text-sm text-center py-4">{error}</div>
            ) : (
                <>
                    {/* Video Preview/Playback */}
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                        {!videoUrl ? (
                            <video
                                ref={previewRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover mirror"
                                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                            />
                        ) : (
                            <video
                                ref={playbackRef}
                                src={videoUrl}
                                controls
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Recording indicator */}
                        {isRecording && (
                            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                REC
                            </div>
                        )}

                        {/* Duration */}
                        <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-sm font-mono">
                            {formatDuration(duration)}
                        </div>

                        {/* Switch camera button */}
                        {!videoUrl && !isRecording && (
                            <button
                                onClick={switchCamera}
                                className="absolute bottom-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                title="Switch camera"
                            >
                                <SwitchCameraIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                        {!videoUrl && !isRecording && (
                            <button
                                onClick={startRecording}
                                className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                title="Start recording"
                            >
                                <VideoIcon className="w-6 h-6" />
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full animate-pulse transition-colors"
                                title="Stop recording"
                            >
                                <StopCircleIcon className="w-6 h-6" />
                            </button>
                        )}

                        {videoUrl && !isRecording && (
                            <>
                                <button
                                    onClick={() => {
                                        setVideoBlob(null);
                                        setVideoUrl(null);
                                        setDuration(0);
                                    }}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <SendIcon className="w-4 h-4" />
                                    Send
                                </button>
                            </>
                        )}

                        <button
                            onClick={handleCancel}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-full transition-colors"
                            title="Cancel"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 text-center">
                        Max 60 seconds • Click record to start
                    </p>
                </>
            )}
        </div>
    );
}

export default VideoRecorder;

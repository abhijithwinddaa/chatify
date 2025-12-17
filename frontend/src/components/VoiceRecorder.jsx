import { useState, useRef, useEffect } from "react";
import { MicIcon, StopCircleIcon, XIcon, SendIcon } from "lucide-react";

/**
 * VoiceRecorder Component
 * 
 * Records audio using MediaRecorder API and provides:
 * - Recording start/stop control
 * - Duration timer
 * - Waveform visualization
 * - Send/Cancel options after recording
 */
function VoiceRecorder({ onSend, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopRecording();
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    // Format duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Draw waveform visualization
    const drawWaveform = () => {
        if (!analyserRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = "rgb(30, 41, 59)"; // slate-800
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgb(6, 182, 212)"; // cyan-500
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        draw();
    };

    const startRecording = async () => {
        try {
            setError(null);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Set up audio analyser for visualization
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Start visualization
            drawWaveform();

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus"
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);

            // Start duration timer
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please allow microphone permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        setIsRecording(false);
    };

    const handleCancel = () => {
        stopRecording();
        setDuration(0);
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        onCancel();
    };

    const handleSend = async () => {
        if (!audioBlob) return;

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            onSend(reader.result, duration);
            handleCancel();
        };
        reader.readAsDataURL(audioBlob);
    };

    return (
        <div className="flex items-center gap-3 bg-slate-800/80 rounded-lg p-3 border border-slate-700/50">
            {error ? (
                <div className="flex-1 text-red-400 text-sm">{error}</div>
            ) : (
                <>
                    {/* Waveform / Audio preview */}
                    <div className="flex-1">
                        {isRecording ? (
                            <canvas
                                ref={canvasRef}
                                width={200}
                                height={40}
                                className="w-full h-10 rounded"
                            />
                        ) : audioUrl ? (
                            <audio src={audioUrl} controls className="h-10 w-full" />
                        ) : (
                            <div className="text-slate-400 text-sm">Click mic to record</div>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="text-cyan-400 font-mono text-sm min-w-[50px] text-center">
                        {formatDuration(duration)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {!isRecording && !audioBlob && (
                            <button
                                onClick={startRecording}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                title="Start recording"
                            >
                                <MicIcon className="w-5 h-5" />
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full animate-pulse transition-colors"
                                title="Stop recording"
                            >
                                <StopCircleIcon className="w-5 h-5" />
                            </button>
                        )}

                        {audioBlob && !isRecording && (
                            <>
                                <button
                                    onClick={handleSend}
                                    className="p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors"
                                    title="Send voice message"
                                >
                                    <SendIcon className="w-5 h-5" />
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
                </>
            )}
        </div>
    );
}

export default VoiceRecorder;

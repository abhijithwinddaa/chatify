import { useState, useRef } from "react";
import { MapPinIcon, LocateIcon, XIcon, SendIcon } from "lucide-react";

/**
 * LocationPicker Component
 * 
 * Gets user's location and shows preview before sending
 */
function LocationPicker({ onSend, onCancel }) {
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [address, setAddress] = useState("");

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });

                // Try to get address using reverse geocoding (Nominatim - free)
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    if (data.display_name) {
                        setAddress(data.display_name);
                    }
                } catch (err) {
                    console.log("Could not get address:", err);
                }

                setIsLoading(false);
            },
            (err) => {
                setError("Could not get your location. Please allow location access.");
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSend = () => {
        if (!location) return;
        onSend({
            latitude: location.latitude,
            longitude: location.longitude,
            address: address || null,
            isLiveLocation: false
        });
    };

    // Generate OpenStreetMap static image URL
    const getMapImageUrl = () => {
        if (!location) return null;
        // Using OpenStreetMap's tile server for a simple static map
        return `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`;
    };

    return (
        <div className="flex flex-col gap-3 bg-slate-800/80 rounded-lg p-4 border border-slate-700/50">
            {error ? (
                <div className="text-red-400 text-sm text-center py-4">{error}</div>
            ) : !location ? (
                <div className="flex flex-col items-center gap-4 py-6">
                    <MapPinIcon className="w-12 h-12 text-cyan-400" />
                    <p className="text-slate-300 text-center">Share your current location</p>
                    <button
                        onClick={getCurrentLocation}
                        disabled={isLoading}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Getting location...
                            </>
                        ) : (
                            <>
                                <LocateIcon className="w-4 h-4" />
                                Get My Location
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <>
                    {/* Map Preview */}
                    <div className="relative rounded-lg overflow-hidden bg-slate-700 aspect-video">
                        <iframe
                            src={getMapImageUrl()}
                            className="w-full h-full border-0"
                            title="Location preview"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            Your Location
                        </div>
                    </div>

                    {/* Address */}
                    {address && (
                        <p className="text-sm text-slate-300 truncate" title={address}>
                            📍 {address}
                        </p>
                    )}

                    {/* Coordinates */}
                    <p className="text-xs text-slate-400">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setLocation(null);
                                setAddress("");
                            }}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={handleSend}
                            className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <SendIcon className="w-4 h-4" />
                            Send Location
                        </button>
                    </div>
                </>
            )}

            <button
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-200 text-sm text-center transition-colors"
            >
                Cancel
            </button>
        </div>
    );
}

export default LocationPicker;

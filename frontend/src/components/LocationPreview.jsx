import { MapPinIcon, ExternalLinkIcon } from "lucide-react";

/**
 * LocationPreview Component
 * 
 * Displays shared location in chat with:
 * - Map preview
 * - Address
 * - Open in Maps link
 */
function LocationPreview({ latitude, longitude, address }) {
    // Generate Google Maps link
    const getMapsLink = () => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    // Generate OpenStreetMap embed URL
    const getMapEmbedUrl = () => {
        return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.005},${longitude + 0.005},${latitude + 0.005}&layer=mapnik&marker=${latitude},${longitude}`;
    };

    return (
        <div className="rounded-lg overflow-hidden bg-slate-700/50 min-w-[200px] max-w-[280px]">
            {/* Map Preview */}
            <div className="relative aspect-video">
                <iframe
                    src={getMapEmbedUrl()}
                    className="w-full h-full border-0"
                    title="Location"
                />
            </div>

            {/* Location Info */}
            <div className="p-3">
                <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        {address ? (
                            <p className="text-sm text-slate-200 line-clamp-2">{address}</p>
                        ) : (
                            <p className="text-sm text-slate-200">Shared Location</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>
                    </div>
                </div>

                {/* Open in Maps button */}
                <a
                    href={getMapsLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm transition-colors"
                >
                    <ExternalLinkIcon className="w-3 h-3" />
                    Open in Maps
                </a>
            </div>
        </div>
    );
}

export default LocationPreview;

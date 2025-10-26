import React, { useState } from "react";
import { User, ZoomIn, X } from "lucide-react";

export default function ProfilePic({ src, size = 40 }) {
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <>
      {/* Avatar thumbnail */}
      <div
        onClick={() => setIsZoomed(true)}
        className="relative group cursor-pointer border-2 border-white shadow-md rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600"
        style={{ width: size, height: size }}
      >
        {/* Fallback if no image */}
        {(!src || error) && (
          <div className="w-full h-full flex items-center justify-center">
            <User className="text-white w-1/2 h-1/2" />
          </div>
        )}

        {/* ✅ Actual image layer */}
        {src && !error && (
          <img
            src={src}
            alt="Profile"
            className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-300 ${
              loading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setLoading(false)}
            onError={() => setError(true)}
          />
        )}

        {/* Hover overlay with zoom icon */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300 flex items-center justify-center">
          <ZoomIn className="text-white opacity-0 group-hover:opacity-100 w-4 h-4 transition-opacity duration-300" />
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-2xl max-h-full bg-white p-2 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ❌ Close button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {src && !error ? (
              <>
                {/* Skeleton shimmer while loading */}
                {loading && (
                  <div className="w-[500px] h-[500px] max-h-[70vh] bg-gray-200 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
                  </div>
                )}

                <img
                  src={src}
                  alt="Profile Preview"
                  className={`w-full h-auto max-h-[70vh] object-contain rounded-md bg-gray-200 transition-opacity duration-500 ${
                    loading ? "opacity-0" : "opacity-100"
                  }`}
                  onError={() => setError(true)}
                  onLoad={() => setLoading(false)}
                />
              </>
            ) : (
              <div className="w-64 h-64 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                <User className="text-white w-20 h-20" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

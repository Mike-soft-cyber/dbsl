import React, { useState, useEffect } from "react";
import { User, ZoomIn, X } from "lucide-react";
import { getProfilePictureUrl } from "@/utils/profilePicUtils";

export default function ProfilePic({ src, size = 40 }) {
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  
  // ✅ Use utility function to get proper URL
  useEffect(() => {
    console.log('📸 ProfilePic received src:', src);
    const url = getProfilePictureUrl(src);
    console.log('🎯 Resolved to URL:', url);
    setImageUrl(url);
    setError(false);
    setLoading(true);
  }, [src]);

  return (
    <>
      {/* Avatar thumbnail */}
      <div
        onClick={() => imageUrl && setIsZoomed(true)}
        className={`relative group border-2 border-white shadow-md rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 ${
          imageUrl ? 'cursor-pointer' : ''
        }`}
        style={{ width: size, height: size }}
      >
        {/* Fallback if no image */}
        {(!imageUrl || error) && (
          <div className="w-full h-full flex items-center justify-center">
            <User className="text-white w-1/2 h-1/2" />
          </div>
        )}

        {/* ✅ Actual image layer */}
        {imageUrl && !error && (
          <img
            src={imageUrl}
            alt="Profile"
            className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-300 ${
              loading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', imageUrl);
              setLoading(false);
            }}
            onError={() => {
              console.error('❌ Image failed to load:', imageUrl);
              setError(true);
            }}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        )}

        {/* Hover overlay with zoom icon */}
        {imageUrl && !error && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300 flex items-center justify-center">
            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 w-4 h-4 transition-opacity duration-300" />
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {isZoomed && imageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-2xl max-h-full bg-white p-2 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {imageUrl && !error ? (
              <>
                {/* Skeleton shimmer while loading */}
                {loading && (
                  <div className="w-[500px] h-[500px] max-h-[70vh] bg-gray-200 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
                  </div>
                )}

                <img
                  src={imageUrl}
                  alt="Profile Preview"
                  className={`w-full h-auto max-h-[70vh] object-contain rounded-md bg-gray-200 transition-opacity duration-500 ${
                    loading ? "opacity-0" : "opacity-100"
                  }`}
                  onError={() => setError(true)}
                  onLoad={() => setLoading(false)}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
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
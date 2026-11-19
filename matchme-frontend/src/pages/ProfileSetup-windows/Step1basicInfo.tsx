import { useState } from "react";
import type { ProfileData } from "../../types/types";
import { API_BASE_URL } from "../../config";

interface Step1Props {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onNext: () => void;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

function Step1BasicInfo({ profileData, setProfileData, onNext }: Step1Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData({ ...profileData, profilePicture: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getPreviewUrl = () => {
    if (imagePreview) return imagePreview;
    const pic = profileData.profilePicture;
    if (!pic) return "/default-alien-avatar.png";
    if (pic instanceof File) return URL.createObjectURL(pic);
    return `${API_BASE_URL}/user-photos/${pic}`;
  };

  const handleLocationSearch = async () => {
    if (!profileData.location.trim()) return;

    setIsScanning(true);
    setGeoResults([]);
    setShowDropdown(false);

    try {
      // Using OpenStreetMap (Nominatim) - Free, no key required for low volume
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          profileData.location
        )}`
      );
      const data = await response.json();
      setGeoResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error("Satellite uplink failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const selectLocation = (result: GeoResult) => {
    setProfileData({
      ...profileData,
      location: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
    setShowDropdown(false);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto border-2 md:border-4 border-green-400 alien-glow p-4 md:p-8 my-2 md:my-4 bg-black/80 backdrop-blur-sm">
      <h2
        className="text-2xl md:text-4xl lg:text-5xl mb-4 md:mb-8 text-green-400 text-center alien-glow"
        style={{ fontFamily: "Sevastopol Interface" }}
      >
        IDENTITY CONFIGURATION
      </h2>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Left Column: Photo Upload */}
        <div className="w-full md:w-1/3 flex flex-col items-center">
          <div className="w-48 h-48 md:w-64 md:h-64 border-2 md:border-4 border-green-500 mb-4 relative overflow-hidden group">
            <img
              src={getPreviewUrl()}
              alt="Profile Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-green-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p
                className="text-green-300 font-bold text-sm md:text-base"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                UPLOAD_NEW
              </p>
            </div>
          </div>

          <label
            className="cursor-pointer border-2 md:border-4 border-green-500 bg-green-900/30 hover:bg-green-600 hover:text-black text-green-400 px-4 md:px-6 py-2 font-bold transition-all text-sm md:text-base text-center w-full"
            style={{ fontFamily: "Sevastopol Interface" }}
          >
            SELECT IMAGE
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {(profileData.profilePicture || imagePreview) && !profileData.removePhoto && (
            <button
              onClick={() => {
                setProfileData({ ...profileData, removePhoto: true });
                setImagePreview(null);
              }}
              className="mt-2 border-2 md:border-4 border-red-500 bg-red-900/30 hover:bg-red-600 text-red-400 px-4 md:px-6 py-2 font-bold transition-all text-sm md:text-base w-full"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              REMOVE PHOTO
            </button>
          )}

          {profileData.removePhoto && (
            <button
              onClick={() => setProfileData({ ...profileData, removePhoto: false })}
              className="mt-2 border-2 md:border-4 border-blue-500 bg-blue-900/30 hover:bg-blue-600 text-blue-400 px-4 md:px-6 py-2 font-bold transition-all text-sm md:text-base w-full"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              RESTORE PHOTO
            </button>
          )}
        </div>

        <div className="flex-1 space-y-4 md:space-y-6">

          <div>
            <label
              className="block text-lg md:text-xl lg:text-2xl text-green-400 mb-2"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              FULL DESIGNATION (NAME)
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              className="w-full bg-black/50 border-2 md:border-4 border-green-500 p-2 md:p-4 text-lg md:text-xl lg:text-2xl text-green-300 focus:outline-none focus:border-green-300 placeholder-green-800"
              style={{ fontFamily: "Sevastopol Interface" }}
              placeholder="ENTER NAME..."
            />
          </div>

          <div className="relative">
            <label
              className="block text-lg md:text-xl lg:text-2xl text-green-400 mb-2"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              SECTOR LOCATION
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={profileData.location}
                onChange={(e) =>
                  setProfileData({ ...profileData, location: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
                className="flex-1 bg-black/50 border-2 md:border-4 border-green-500 p-2 md:p-4 text-lg md:text-xl lg:text-2xl text-green-300 focus:outline-none focus:border-green-300 placeholder-green-800"
                style={{ fontFamily: "Sevastopol Interface" }}
                placeholder="ENTER CITY..."
              />
              <button
                onClick={handleLocationSearch}
                disabled={isScanning}
                className="border-2 md:border-4 border-green-500 bg-green-900/30 hover:bg-green-600 text-green-300 hover:text-black px-4 md:px-6 py-2 md:py-4 font-bold min-w-[100px] md:min-w-[140px] text-sm md:text-base"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                {isScanning ? "SCANNING..." : "SCAN"}
              </button>
            </div>

            {profileData.latitude != null &&
              profileData.longitude != null && (
                <p
                  className="text-green-600 text-xs md:text-sm mt-1 font-mono"
                  style={{ fontFamily: "Sevastopol Interface" }}
                >
                  COORDS LOCKED: {profileData.latitude.toFixed(4)},{" "}
                  {profileData.longitude.toFixed(4)}
                </p>
              )}

            {/* Dropdown Results */}
            {showDropdown && geoResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-black border-2 md:border-4 border-green-500 max-h-48 md:max-h-60 overflow-y-auto">
                {geoResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => selectLocation(result)}
                    className="p-2 md:p-3 hover:bg-green-900/50 cursor-pointer text-green-300 border-b border-green-900 last:border-0 text-sm md:text-base"
                    style={{ fontFamily: "Sevastopol Interface" }}
                  >
                    {result.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              className="block text-lg md:text-xl lg:text-2xl text-green-400 mb-2"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              BIOGRAPHICAL DATA
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              className="w-full h-24 md:h-32 bg-black/50 border-2 md:border-4 border-green-500 p-2 md:p-4 text-base md:text-lg lg:text-xl text-green-300 focus:outline-none focus:border-green-300 placeholder-green-800 resize-none"
              style={{ fontFamily: "Sevastopol Interface" }}
              placeholder="ENTER BIO..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onNext}
              disabled={!profileData.name || !profileData.location}
              className="border-2 md:border-4 border-green-500 bg-green-600 hover:bg-green-500 text-black px-6 md:px-8 py-2 md:py-3 text-lg md:text-xl lg:text-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              INITIATE PHASE 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step1BasicInfo;
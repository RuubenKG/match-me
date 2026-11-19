import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import Step1BasicInfo from "./ProfileSetup-windows/Step1basicInfo";
import Step2Movies from "./ProfileSetup-windows/Step2Movies";
import Step3Confirmation from "./ProfileSetup-windows/Step3Confirmation";
import { API_BASE_URL } from "../config";
import AlienBackground from "../components/alien-background";
import "../styles/crt-effect.css";
import type { ProfileData, Movie, Actor } from "../types/types";
import Step2Genres from "./ProfileSetup-windows/Step2Genres";
import Step3Actors from "./ProfileSetup-windows/Step3Actors";

function ProfileSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    location: "",
    bio: "",
    profilePicture: null,
    favoriteMovies: [],
    dislikedMovies: [],
    favoriteGenres: [],
    dislikedGenres: [],
    favoriteActors: [],
    dislikedActors: [],
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setProfileData((prev) => ({ ...prev, name: data.name }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };
    fetchUserInfo();
  }, []);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorMessage("No authentication token found.");
      setLoading(false);
      return;
    }

    const profileDto = {
      firstName: profileData.name.split(" ")[0] || "",
      lastName: profileData.name.split(" ").slice(1).join(" ") || "",
      location: profileData.location,
      latitude: profileData.latitude || null,
      longitude: profileData.longitude || null,
      bio: profileData.bio,
      maxDistance: profileData.maxDistance || 50,
      removePhoto: profileData.removePhoto || false,
      favoriteMovies: profileData.favoriteMovies.map((m: Movie) => Number(m.id)),
      dislikedMovies: profileData.dislikedMovies.map((m: Movie) => Number(m.id)),
      favoriteGenres: profileData.favoriteGenres,
      dislikedGenres: profileData.dislikedGenres,
      favoriteActors: profileData.favoriteActors.map((a: Actor) => Number(a.id)),
      dislikedActors: profileData.dislikedActors.map((a: Actor) => Number(a.id)),
    };

    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(profileDto)], { type: "application/json" }));

    if (profileData.profilePicture instanceof File) {
      formData.append("image", profileData.profilePicture);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.status === 403) {
        throw new Error("Access Denied: Check backend CORS/Security settings.");
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Update failed");
      }

      navigate("/MainPage");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlienBackground />
      <div className="min-h-screen p-4 md:p-8 relative z-20 flex flex-col items-center overflow-y-auto">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
            <div className="text-xl md:text-2xl text-green-400 font-sevastopol alien-glow uppercase">
              System Configuration: Phase {currentStep} / 5
            </div>
            <button
              onClick={async () => {
                await (window as any).disconnectSocket?.();
                authService.logout();
                navigate("/login");
              }}
              className="border-4 border-red-500 bg-red-900/50 hover:bg-red-700 px-6 py-2 text-red-400 hover:text-white text-lg md:text-xl font-bold alien-glow-red transition-all font-sevastopol"
            >
              LOGOUT
            </button>
          </div>

          {errorMessage && (
            <div
              className="mb-4 p-4 bg-red-900/40 border-4 border-red-500 text-red-200 alien-glow-red text-base md:text-lg font-sevastopol uppercase"
            >
              CRITICAL ERROR: {errorMessage}
            </div>
          )}

          <div className={`transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
            {currentStep === 1 && <Step1BasicInfo profileData={profileData} setProfileData={setProfileData} onNext={handleNext} />}
            {currentStep === 2 && <Step2Genres profileData={profileData} setProfileData={setProfileData} onNext={handleNext} onBack={handleBack} />}
            {currentStep === 3 && <Step2Movies profileData={profileData} setProfileData={setProfileData} onNext={handleNext} onBack={handleBack} />}
            {currentStep === 4 && <Step3Actors profileData={profileData} setProfileData={setProfileData} onNext={handleNext} onBack={handleBack} />}
            {currentStep === 5 && (
              <>
                <Step3Confirmation profileData={profileData} onSubmit={handleSubmit} onBack={handleBack} />
                {loading && <p className="text-green-500 mt-4 text-center animate-pulse text-xl font-sevastopol uppercase">Uploading to Sevastapol Archives...</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileSetup;

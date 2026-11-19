import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Step1BasicInfo from "./ProfileSetup-windows/Step1basicInfo";
import Step2Movies from "./ProfileSetup-windows/Step2Movies";
import Step3Confirmation from "./ProfileSetup-windows/Step3Confirmation";
import AlienBackground from "../components/alien-background";
import { authService } from "../services/authService";
import { userService } from "../api/userService.ts";
import "../styles/crt-effect.css";
import type { ProfileData, Movie, Actor } from "../types/types.ts";
import Step2Genres from "./ProfileSetup-windows/Step2Genres";
import Step3Actors from "./ProfileSetup-windows/Step3Actors";
import { API_BASE_URL } from "../config";

function EditProfile() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    const initializeEditData = async () => {
      try {
        setLoading(true);
        const data = await userService.getMyProfile();

        const fetchMovieDetails = async (id: number): Promise<Movie> => {
          try {
            const resp = await fetch(`${API_BASE_URL}/api/movies/${id}`);
            if (!resp.ok) throw new Error("Movie not found");
            const movieData = await resp.json();
            return {
              id: movieData.id,
              title: movieData.title,
              posterUrl: `https://image.tmdb.org/t/p/w300${movieData.poster_path}`,
              year: movieData.release_date ? new Date(movieData.release_date).getFullYear().toString() : "N/A"
            };
          } catch {
            return { id: id.toString(), title: `Unknown Movie (${id})`, posterUrl: "", year: "N/A" };
          }
        };

        const fetchActorDetails = async (id: number): Promise<Actor> => {
          try {
            const resp = await fetch(`${API_BASE_URL}/api/movies/actors/${id}`);
            if (!resp.ok) throw new Error("Actor not found");
            const actorData = await resp.json();
            return {
              id: actorData.id.toString(),
              name: actorData.name,
              profilePath: actorData.profile_path ? `https://image.tmdb.org/t/p/w300${actorData.profile_path}` : "https://via.placeholder.com/300x450?text=No+Photo"
            };
          } catch {
            return { id: id.toString(), name: `Unknown Actor (${id})`, profilePath: "" };
          }
        };

        const [likedObjects, dislikedObjects, favActorObjects, dislikedActorObjects] = await Promise.all([
          Promise.all((data.favoriteMovies || []).map(fetchMovieDetails)),
          Promise.all((data.dislikedMovies || []).map(fetchMovieDetails)),
          Promise.all((data.favoriteActors || []).map(fetchActorDetails)),
          Promise.all((data.dislikedActors || []).map(fetchActorDetails))
        ]);

        setProfileData({
          name: `${data.firstName} ${data.lastName}`,
          location: data.location || "",
          latitude: data.latitude,
          longitude: data.longitude,
          bio: data.bio || "",
          profilePicture: data.profilePictureUrl || null,
          favoriteMovies: likedObjects,
          dislikedMovies: dislikedObjects,
          favoriteGenres: data.favoriteGenres || [],
          dislikedGenres: data.dislikedGenres || [],
          favoriteActors: favActorObjects,
          dislikedActors: dislikedActorObjects
        });

        setHasProfile(true);
      } catch (err) {
        console.error("Failed to load profile for editing:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeEditData();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    const token = localStorage.getItem("authToken");

    try {
      const formData = new FormData();
      const profileDto = {
        firstName: profileData.name.split(" ")[0],
        lastName: profileData.name.split(" ").slice(1).join(" "),
        location: profileData.location,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        bio: profileData.bio,
        maxDistance: profileData.maxDistance,
        removePhoto: profileData.removePhoto,
        favoriteMovies: profileData.favoriteMovies.map(m => Number(m.id)),
        dislikedMovies: profileData.dislikedMovies.map(m => Number(m.id)),
        favoriteGenres: profileData.favoriteGenres,
        dislikedGenres: profileData.dislikedGenres,
        favoriteActors: profileData.favoriteActors.map(a => Number(a.id)),
        dislikedActors: profileData.dislikedActors.map(a => Number(a.id))
      };

      formData.append("data", new Blob([JSON.stringify(profileDto)], {
        type: "application/json"
      }));

      if (profileData.profilePicture instanceof File) {
        formData.append("image", profileData.profilePicture);
      }

      const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Update failed");

      // Show success UI then navigate
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/ViewProfile");
      }, 1500);

    } catch (error) {
      console.error("Submission error:", error);
      alert("CRITICAL ERROR: Transmission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-4xl text-green-400 alien-glow animate-pulse font-sevastopol uppercase">INITIALIZING NEURAL LINK...</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black z-50 fixed inset-0">
        <AlienBackground />
        <h1 className="text-5xl md:text-7xl text-green-400 alien-glow font-sevastopol uppercase mb-4 animate-bounce">
          SUCCESS
        </h1>
        <p className="text-2xl text-green-600 font-sevastopol uppercase tracking-widest animate-pulse">
          PROFILE RECONFIGURED
        </p>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <>
        <AlienBackground />
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center z-20 relative">
          <p className="text-4xl text-red-400 alien-glow-red font-sevastopol uppercase">NO PROFILE FOUND</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/ProfileSetup")}
              className="border-4 border-green-500 bg-green-600 hover:bg-green-700 px-8 py-3 text-black hover:text-white text-2xl font-bold alien-glow transition-all font-sevastopol"
            >
              CREATE
            </button>
            <button
              onClick={() => navigate("/MainPage")}
              className="border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-8 py-3 text-green-300 hover:text-white text-2xl font-bold alien-glow transition-all font-sevastopol"
            >
              BACK
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AlienBackground />
      <div className="min-h-screen relative z-20 flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto w-full">
        {/* Integrated Header */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-6 gap-4">
          <button
            onClick={() => navigate("/ViewProfile")}
            className="border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-6 py-2 text-green-300 hover:text-white text-lg md:text-xl font-bold alien-glow transition-all font-sevastopol"
          >
            CANCEL
          </button>
          <div className="text-2xl font-bold text-green-400 alien-glow font-sevastopol uppercase hidden sm:block">
            Modifying Profile
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

        <div className={`w-full max-w-4xl border-4 border-green-500 bg-black/80 backdrop-blur-md p-4 md:p-8 animate-fade-in alien-glow ${submitting ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex justify-between items-center mb-8 border-b-4 border-green-900 pb-4 flex-wrap gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-green-400 uppercase tracking-widest font-sevastopol">DATA RECONFIG</h1>
            <div className="text-xl md:text-2xl text-green-600 font-bold font-sevastopol">PHASE: {currentStep} / 5</div>
          </div>

          {currentStep === 1 && <Step1BasicInfo profileData={profileData} setProfileData={setProfileData} onNext={handleNext} />}
          {currentStep === 2 && <Step2Genres profileData={profileData} setProfileData={setProfileData} onNext={handleNext} onBack={handleBack} />}
          {currentStep === 3 && <Step2Movies profileData={profileData} setProfileData={setProfileData} onNext={handleNext} onBack={handleBack} />}
          {currentStep === 4 && <Step3Actors profileData={profileData} setProfileData={setProfileData} onNext={handleNext} onBack={handleBack} />}
          {currentStep === 5 && <Step3Confirmation profileData={profileData} onSubmit={handleSubmit} onBack={handleBack} />}

          {submitting && <p className="text-green-500 mt-4 text-center animate-pulse font-sevastopol uppercase">UPLOADING TO SEVASTOPOL ARCHIVES...</p>}
        </div>
      </div>
    </>
  );
}

export default EditProfile;

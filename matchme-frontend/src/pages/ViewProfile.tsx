import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import AlienBackground from "../components/alien-background";
import "../styles/crt-effect.css";
import { userService } from "../api/userService.ts";
import type { ProfileData, Movie, Actor } from "../types/types.ts";
import { API_BASE_URL } from "../config";

function ViewProfile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const getDisplayImage = (pic: string | File | null) => {
    if (!pic) return "/default-alien-avatar.png";
    if (pic instanceof File) {
      return URL.createObjectURL(pic);
    }
    return `${API_BASE_URL}/user-photos/${pic}`;
  };

  useEffect(() => {
    const fetchProfileAndMovies = async () => {
      try {
        setLoading(true);
        const data = await userService.getMyProfile();

        const fetchMovieDetails = async (id: number): Promise<Movie> => {
          const resp = await fetch(`${API_BASE_URL}/api/movies/${id}`);
          if (!resp.ok) return { id, title: `Unknown ID: ${id}`, posterUrl: "", year: "N/A" };
          const movieData = await resp.json();
          return {
            id: movieData.id,
            title: movieData.title,
            posterUrl: `https://image.tmdb.org/t/p/w300${movieData.poster_path}`,
            year: movieData.release_date ? new Date(movieData.release_date).getFullYear().toString() : "N/A"
          };
        };

        const fetchActorDetails = async (id: number): Promise<Actor> => {
          const resp = await fetch(`${API_BASE_URL}/api/movies/actors/${id}`);
          if (!resp.ok) return { id: id.toString(), name: `ID: ${id}`, profilePath: "" };
          const actorData = await resp.json();
          return {
            id: actorData.id.toString(),
            name: actorData.name,
            profilePath: actorData.profile_path ? `https://image.tmdb.org/t/p/w300${actorData.profile_path}` : ""
          };
        };

        const [likedObjects, dislikedObjects, likedActors, dislikedActors] = await Promise.all([
          Promise.all((data.favoriteMovies || []).map(fetchMovieDetails)),
          Promise.all((data.dislikedMovies || []).map(fetchMovieDetails)),
          Promise.all((data.favoriteActors || []).map(fetchActorDetails)),
          Promise.all((data.dislikedActors || []).map(fetchActorDetails)),
        ]);

        setProfileData({
          name: `${data.firstName} ${data.lastName}`,
          profilePicture: data.profilePictureUrl,
          location: data.location || "Unknown",
          favoriteMovies: likedObjects,
          dislikedMovies: dislikedObjects,
          favoriteGenres: data.favoriteGenres || [],
          dislikedGenres: data.dislikedGenres || [],
          favoriteActors: likedActors,
          dislikedActors: dislikedActors,
          bio: data.bio || "",
          email: data.email || null // Explicitly handle undefined
        });
      } catch (err) {
        console.error("Enrichment failed:", err);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndMovies();
  }, []);

  if (loading) {
    return (
      <>
        <AlienBackground />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-4xl text-green-400 alien-glow animate-pulse font-sevastopol">
            LOADING PROFILE...
          </p>
        </div>
      </>
    );
  }

  if (!profileData) {
    return (
      <>
        <AlienBackground />
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
          <p className="text-4xl text-red-400 alien-glow-red font-sevastopol uppercase">NO PROFILE FOUND</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/ProfileSetup")}
              className="border-4 border-green-500 bg-green-600 hover:bg-green-700 px-8 py-3 text-black hover:text-white text-2xl font-bold alien-glow transition-all font-sevastopol"
            >
              CREATE PROFILE
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
      <div className="min-h-screen flex flex-col relative z-20 p-4 md:p-8 animate-fade-in overflow-y-auto">
        <div className="max-w-[1600px] mx-auto w-full flex justify-between items-center mb-6 gap-4">
          <button
            onClick={() => navigate("/MainPage")}
            className="border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-6 py-3 text-green-300 hover:text-white text-lg md:text-xl font-bold alien-glow transition-all font-sevastopol"
          >
            BACK
          </button>
          <button
            onClick={async () => {
              await (window as any).disconnectSocket?.();
              authService.logout();
              navigate("/login");
            }}
            className="border-4 border-red-500 bg-red-900/50 hover:bg-red-700 px-6 py-3 text-red-400 hover:text-white text-lg md:text-xl font-bold alien-glow-red transition-all font-sevastopol"
          >
            LOGOUT
          </button>
        </div>

        <div className="w-full max-w-[1600px] mx-auto border-2 md:border-4 border-green-400 alien-glow p-4 md:p-8 bg-black/80 backdrop-blur-sm">
          <h2 className="text-3xl md:text-5xl mb-4 md:mb-8 text-green-400 text-center alien-glow font-sevastopol uppercase">
            Personal Dossier
          </h2>

          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            <div className="flex-shrink-0 w-full lg:w-[400px]">
              <div className="mb-8">
                <p className="font-bold text-2xl md:text-3xl mb-4 text-green-400 font-sevastopol">Profile Picture:</p>
                <img
                  src={getDisplayImage(profileData.profilePicture)}
                  className="w-48 h-48 md:w-64 md:h-64 object-cover border-4 border-green-500 alien-glow mx-auto lg:mx-0"
                  alt="User Profile"
                />
              </div>

              <div className="space-y-8 mb-8">
                <div>
                  <p className="text-2xl md:text-3xl text-green-400 font-sevastopol mb-3 border-b-2 border-green-900 pb-1">LIKED MOVIES:</p>
                  {profileData.favoriteMovies.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {profileData.favoriteMovies.map((movie, index) => (
                        <li key={index} className="text-lg md:text-xl text-green-300 font-sevastopol">{movie.title} ({movie.year})</li>
                      ))}
                    </ul>
                  ) : <p className="text-base md:text-lg text-green-300/50 font-sevastopol italic pl-4">No Liked Movies</p>}
                </div>

                <div>
                  <p className="text-2xl md:text-3xl text-orange-500 alien-glow-red font-sevastopol mb-3 border-b-2 border-orange-900 pb-1">DISLIKED MOVIES:</p>
                  {profileData.dislikedMovies.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {profileData.dislikedMovies.map((movie, index) => (
                        <li key={index} className="text-lg md:text-xl text-orange-400 alien-glow-red font-sevastopol">{movie.title} ({movie.year})</li>
                      ))}
                    </ul>
                  ) : <p className="text-base md:text-lg text-orange-300/50 alien-glow-red font-sevastopol italic pl-4">No Aversions recorded</p>}
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-2xl md:text-3xl text-green-400 font-sevastopol mb-3 border-b-2 border-green-900 pb-1">FAVORITE ACTORS:</p>
                  {profileData.favoriteActors.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {profileData.favoriteActors.map((actor, index) => (
                        <li key={index} className="text-lg md:text-xl text-green-300 font-sevastopol">{actor.name}</li>
                      ))}
                    </ul>
                  ) : <p className="text-base md:text-lg text-green-300/50 font-sevastopol italic pl-4">None Selected</p>}
                </div>

                <div>
                  <p className="text-2xl md:text-3xl text-orange-500 alien-glow-red font-sevastopol mb-3 border-b-2 border-orange-900 pb-1">DISLIKED ACTORS:</p>
                  {profileData.dislikedActors.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {profileData.dislikedActors.map((actor, index) => (
                        <li key={index} className="text-lg md:text-xl text-orange-400 alien-glow-red font-sevastopol">{actor.name}</li>
                      ))}
                    </ul>
                  ) : <p className="text-base md:text-lg text-orange-300/50 alien-glow-red font-sevastopol italic pl-4">None Selected</p>}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-8 min-w-0">
              <div>
                <p className="font-bold text-2xl md:text-3xl mb-3 text-green-400 font-sevastopol">Name:</p>
                <div className="border-2 md:border-4 border-green-500 p-4 md:p-6 bg-black/50 text-2xl md:text-4xl text-green-300 font-sevastopol alien-glow">{profileData.name}</div>
              </div>

              <div>
                <p className="font-bold text-2xl md:text-3xl mb-3 text-green-400 font-sevastopol">Location:</p>
                <div className="border-2 md:border-4 border-green-500 p-3 md:p-4 bg-black/50 text-xl md:text-2xl text-green-300 font-sevastopol">{profileData.location}</div>
              </div>

              {(profileData.email !== undefined && profileData.email !== null && profileData.email !== "") && (
                <div>
                  <p className="font-bold text-2xl md:text-3xl mb-3 text-green-400 font-sevastopol">Identification Email:</p>
                  <div className="border-2 md:border-4 border-green-500 p-3 md:p-4 bg-black/50 text-xl md:text-2xl text-green-300 font-sevastopol">{profileData.email}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xl md:text-2xl text-green-400 font-sevastopol mb-3 border-b-2 border-green-900 pb-1 uppercase tracking-tighter">Liked Genres:</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.favoriteGenres.length > 0 ? profileData.favoriteGenres.map(g => (
                      <span key={g} className="px-2 md:px-3 py-1 border-2 border-green-500 bg-green-900/30 text-green-300 text-base md:text-lg font-sevastopol uppercase tracking-widest">{g}</span>
                    )) : <span className="text-green-800 italic font-sevastopol">N/A</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xl md:text-2xl text-orange-500 alien-glow-red font-sevastopol mb-3 border-b-2 border-orange-900 pb-1 uppercase tracking-tighter">Disliked Genres:</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.dislikedGenres.length > 0 ? profileData.dislikedGenres.map(g => (
                      <span key={g} className="px-2 md:px-3 py-1 border-2 border-orange-500 bg-orange-900/30 text-orange-400 text-base md:text-lg font-sevastopol uppercase tracking-widest alien-glow-red">{g}</span>
                    )) : <span className="text-orange-900 alien-glow-red italic font-sevastopol">None</span>}
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-2xl md:text-3xl mb-3 text-green-400 font-sevastopol">Bio:</p>
                <div className="border-2 md:border-4 border-green-500 p-4 md:p-6 bg-black/50 h-64 md:h-[350px] overflow-y-auto text-lg md:text-2xl text-green-300 font-sevastopol whitespace-pre-wrap leading-relaxed">
                  {profileData.bio || "ACCESSING NEURAL FILES... BIO DATA MISSING."}
                </div>
              </div>

              <button
                onClick={() => navigate("/EditProfile")}
                className="w-full border-4 border-green-500 bg-green-900/50 hover:bg-green-700 p-4 text-green-300 hover:text-white text-2xl md:text-3xl font-bold alien-glow transition-all font-sevastopol mt-4"
              >
                EDIT PROFILE DATA
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default ViewProfile;
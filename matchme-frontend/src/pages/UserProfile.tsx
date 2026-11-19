import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService } from "../services/authService";
import AlienBackground from "../components/alien-background";
import "../styles/crt-effect.css";
import type { Movie, Actor } from "../types/types.ts";
import { API_BASE_URL } from "../config";

interface UserData {
  id: number;
  name: string;
  profilePictureUrl: string | null;
  online: boolean;
  lastSeen: string | null;
}

interface ProfileData {
  location: string;
  bio: string;
  email?: string | null;
}

interface BioData {
  favoriteMovies: number[];
  dislikedMovies: number[];
  favoriteGenres: string[];
  dislikedGenres: string[];
  favoriteActors: number[];
  dislikedActors: number[];
}

interface EnrichedProfile {
  id: number;
  name: string;
  profilePicture: string | null;
  location: string;
  bio: string;
  email?: string | null;
  favoriteMovies: Movie[];
  dislikedMovies: Movie[];
  favoriteGenres: string[];
  dislikedGenres: string[];
  favoriteActors: Actor[];
  dislikedActors: Actor[];
  isOnline: boolean;
  lastSeen: string | null;
}

function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const [profileData, setProfileData] = useState<EnrichedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getDisplayImage = (pic: string | null) => {
    if (!pic) return "/default-alien-avatar.png";
    if (pic.startsWith("http")) return pic;
    return `${API_BASE_URL}/user-photos/${pic}`;
  };

  const fetchMovieDetails = async (id: number): Promise<Movie> => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/movies/${id}`);
      if (!resp.ok)
        return { id, title: `Unknown ID: ${id}`, posterUrl: "", year: "N/A" };
      const movieData = await resp.json();
      return {
        id: movieData.id,
        title: movieData.title,
        posterUrl: `https://image.tmdb.org/t/p/w300${movieData.poster_path}`,
        year: movieData.release_date
          ? new Date(movieData.release_date).getFullYear()
          : "N/A",
      };
    } catch {
      return { id, title: `Unknown ID: ${id}`, posterUrl: "", year: "N/A" };
    }
  };

  const fetchActorDetails = async (id: number): Promise<Actor> => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/movies/actors/${id}`);
      if (!resp.ok)
        return { id, name: `Unknown ID: ${id}`, profilePath: "" };
      const actorData = await resp.json();
      return {
        id: actorData.id,
        name: actorData.name,
        profilePath: actorData.profile_path ? `https://image.tmdb.org/t/p/w300${actorData.profile_path}` : "https://via.placeholder.com/300x450?text=No+Photo"
      };
    } catch {
      return { id, name: `Unknown ID: ${id}`, profilePath: "" };
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError("No user ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("authToken");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [userResp, profileResp, bioResp] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/${userId}`, { headers }),
          fetch(`${API_BASE_URL}/api/users/${userId}/profile`, { headers }),
          fetch(`${API_BASE_URL}/api/users/${userId}/bio`, { headers }),
        ]);

        if (!userResp.ok || !profileResp.ok || !bioResp.ok) {
          setError("PROFILE NOT FOUND OR NOT ACCESSIBLE");
          setLoading(false);
          return;
        }

        const userData: UserData = await userResp.json();
        const profileDataResp: ProfileData = await profileResp.json();
        const bioData: BioData = await bioResp.json();

        const [likedMovies, dislikedMovies, favActors, dislikedActors] = await Promise.all([
          Promise.all((bioData.favoriteMovies || []).map(fetchMovieDetails)),
          Promise.all((bioData.dislikedMovies || []).map(fetchMovieDetails)),
          Promise.all((bioData.favoriteActors || []).map(fetchActorDetails)),
          Promise.all((bioData.dislikedActors || []).map(fetchActorDetails)),
        ]);

        setProfileData({
          id: userData.id,
          name: userData.name,
          profilePicture: userData.profilePictureUrl,
          location: profileDataResp.location,
          bio: profileDataResp.bio,
          email: profileDataResp.email,
          favoriteMovies: likedMovies,
          dislikedMovies: dislikedMovies,
          favoriteGenres: bioData.favoriteGenres || [],
          dislikedGenres: bioData.dislikedGenres || [],
          favoriteActors: favActors,
          dislikedActors: dislikedActors,
          isOnline: userData.online,
          lastSeen: userData.lastSeen,
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("FAILED TO LOAD PROFILE DATA");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleDisconnect = async () => {
    if (!userId) return;
    const confirmed = window.confirm("Are you sure you want to disconnect from this user?");
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/connections/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (resp.ok) {
        alert("Link severed. Returning to matching feed.");
        navigate("/MainPage");
      } else {
        alert("Failed to disconnect");
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
      alert("Error disconnecting");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!userId) return;
    navigate(`/chat/${userId}`);
  };

  const renderActionButtons = () => {
    if (actionLoading) {
      return (
        <div className="text-2xl text-green-400 alien-glow animate-pulse font-sevastopol">
          PROCESSING...
        </div>
      );
    }

    return (
      <div className="flex gap-2 min-w-0 flex-shrink">
        <button
          onClick={handleStartChat}
          className="border-4 border-blue-500 bg-blue-600 hover:bg-blue-700 px-3 md:px-8 py-2 md:py-3 text-black hover:text-white text-sm md:text-2xl font-bold alien-glow transition-all font-sevastopol"
        >
          CHAT
        </button>
        <button
          onClick={handleDisconnect}
          className="border-4 border-red-500 bg-red-900/50 hover:bg-red-700 px-3 md:px-6 py-2 md:py-3 text-red-300 hover:text-white text-sm md:text-xl font-bold alien-glow-red transition-all font-sevastopol"
        >
          SEVER
        </button>
      </div>
    );
  };

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

  if (error || !profileData) {
    return (
      <>
        <AlienBackground />
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
          <p className="text-3xl md:text-4xl text-red-400 alien-glow-red text-center font-sevastopol uppercase">
            {error || "PROFILE NOT FOUND"}
          </p>
          <button
            onClick={() => navigate("/MainPage")}
            className="border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-8 py-3 text-green-300 hover:text-white text-xl md:text-2xl font-bold alien-glow transition-all font-sevastopol"
          >
            MAINPAGE
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <AlienBackground />
      <div className="min-h-screen flex flex-col relative z-20 p-4 md:p-8 animate-fade-in overflow-y-auto">
        <div className="max-w-[1600px] mx-auto w-full flex justify-between items-center mb-6 gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-6 py-3 text-green-300 hover:text-white text-lg md:text-xl font-bold alien-glow transition-all font-sevastopol"
          >
            BACK
          </button>

          <div className="flex gap-4">
            {renderActionButtons()}
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
        </div>

        <div className="w-full max-w-[1600px] mx-auto border-2 md:border-4 border-green-400 alien-glow p-3 md:p-8 bg-black/80 backdrop-blur-sm">
          <h2 className="text-2xl md:text-5xl mb-4 md:mb-8 text-green-400 text-center alien-glow font-sevastopol uppercase">
            User Profile
          </h2>

          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            <div className="flex-shrink-0 w-full lg:w-[400px]">
              <div className="mb-6 md:mb-8 text-center lg:text-left">
                <p className="font-bold text-xl md:text-3xl mb-2 md:mb-4 text-green-400 font-sevastopol">Profile Picture:</p>
                <img
                  src={getDisplayImage(profileData.profilePicture)}
                  className="w-32 h-32 md:w-64 md:h-64 object-cover border-4 border-green-500 alien-glow mx-auto lg:mx-0"
                  alt="User Profile"
                />
              </div>

              <div className="space-y-8 mb-8">
                <div>
                  <p className="text-lg md:text-3xl text-green-400 font-sevastopol mb-2 md:mb-3 border-b-2 border-green-900 pb-1">LIKED MOVIES:</p>
                  {profileData.favoriteMovies.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 md:space-y-2">
                      {profileData.favoriteMovies.map((movie, index) => (
                        <li key={index} className="text-sm md:text-xl text-green-300 font-sevastopol">{movie.title} ({movie.year})</li>
                      ))}
                    </ul>
                  ) : <p className="text-base md:text-lg text-green-300/50 font-sevastopol italic pl-4">No Liked Movies</p>}
                </div>

                <div>
                  <p className="text-lg md:text-3xl text-orange-500 alien-glow-red font-sevastopol mb-2 md:mb-3 border-b-2 border-orange-900 pb-1">DISLIKED MOVIES:</p>
                  {profileData.dislikedMovies.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 md:space-y-2">
                      {profileData.dislikedMovies.map((movie, index) => (
                        <li key={index} className="text-sm md:text-xl text-orange-400 alien-glow-red font-sevastopol">{movie.title} ({movie.year})</li>
                      ))}
                    </ul>
                  ) : <p className="text-xs md:text-lg text-orange-300/50 alien-glow-red font-sevastopol italic pl-4">No Aversions recorded</p>}
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
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <p className="font-bold text-3xl md:text-4xl text-green-400 font-sevastopol">Name:</p>
                  <div className={`w-6 h-6 rounded-full ${profileData.isOnline ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)]" : "bg-gray-600"}`} title={profileData.isOnline ? "Online" : "Offline"} />
                  {!profileData.isOnline && profileData.lastSeen && (
                    <span className="text-lg md:text-xl text-green-800 font-sevastopol italic">(LAST SEEN: {new Date(profileData.lastSeen).toLocaleString()})</span>
                  )}
                </div>
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
                <p className="font-bold text-xl md:text-3xl mb-2 md:mb-3 text-green-400 font-sevastopol">Bio:</p>
                <div className="border-2 md:border-4 border-green-500 p-3 md:p-6 bg-black/50 h-32 md:h-[350px] overflow-y-auto text-sm md:text-2xl text-green-300 font-sevastopol whitespace-pre-wrap leading-relaxed">
                  {profileData.bio || "ACCESSING NEURAL FILES... BIO DATA MISSING."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserProfile;
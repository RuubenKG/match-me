import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { authService } from "../services/authService";
import { useWebSocket } from "../contexts/WebSocketContext";
import AlienBackground from "../components/alien-background";
import "../styles/crt-effect.css";
import type { Movie, Actor } from "../types/types.ts";

// const USE_MOCK_DATA = false;

interface Recommendation {
  id: number;
  name: string;
  profilePicture: string | null;
  location: string;
  bio: string;
  favoriteMovies: Movie[];
  dislikedMovies: Movie[];
  favoriteGenres: string[];
  dislikedGenres: string[];
  favoriteActors: Actor[];
  dislikedActors: Actor[];
  distance?: number;
  chatId?: string;
}

function MainPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maxDistance, setMaxDistance] = useState(5050); // Default to Anywhere (5050)
  const [pendingDistance, setPendingDistance] = useState(5050);

  // NEW: Match Overlay State
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [lastMatchedUser, setLastMatchedUser] = useState<Recommendation | null>(null);

  const getDisplayImage = (pic: string | null) => {
    if (!pic) return "/default-alien-avatar.png";
    if (pic.startsWith('http')) return pic;
    return `${API_BASE_URL}/user-photos/${pic}`;
  };

  const fetchMovieDetails = async (id: number): Promise<Movie> => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/movies/${id}`);
      if (!resp.ok) return { id, title: `ID: ${id}`, posterUrl: "", year: "N/A" };
      const movieData = await resp.json();
      return {
        id: movieData.id,
        title: movieData.title,
        posterUrl: `https://image.tmdb.org/t/p/w300${movieData.poster_path}`,
        year: movieData.release_date ? new Date(movieData.release_date).getFullYear().toString() : "N/A",
      };
    } catch {
      return { id, title: `ID: ${id}`, posterUrl: "", year: "N/A" };
    }
  };

  const fetchActorDetails = async (id: number): Promise<Actor> => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/movies/actors/${id}`);
      if (!resp.ok) return { id: id.toString(), name: `ID: ${id}`, profilePath: "" };
      const actorData = await resp.json();
      return {
        id: actorData.id.toString(),
        name: actorData.name,
        profilePath: actorData.profile_path ? `https://image.tmdb.org/t/p/w300${actorData.profile_path}` : "https://via.placeholder.com/300x450?text=No+Photo",
      };
    } catch {
      return { id: id.toString(), name: `ID: ${id}`, profilePath: "" };
    }
  };

  const fetchRecommendations = async (currentOffset: number) => {
    try {
      if (currentOffset === 0) setLoading(true);
      else setLoadingMore(true);

      const token = localStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch IDs first
      const recsResp = await fetch(`${API_BASE_URL}/api/match/me?offset=${currentOffset}&limit=10&maxDistance=${maxDistance}`, { headers });
      if (!recsResp.ok) throw new Error("Failed to fetch matches");

      const candidateData: number[] = await recsResp.json();

      if (candidateData.length === 0) {
        setHasMore(false);
        return;
      }

      // 0. Fetch my own profile to get my coordinates for distance calculation
      const myProfileResp = await fetch(`${API_BASE_URL}/api/me/profile`, { headers });
      const myProfile = myProfileResp.ok ? await myProfileResp.json() : null;

      // Hydrate each candidate
      const enrichedRecs = await Promise.all(
        candidateData.map(async (userId) => {
          try {
            const [userResp, profileResp, bioResp] = await Promise.all([
              fetch(`${API_BASE_URL}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
              fetch(`${API_BASE_URL}/api/users/${userId}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
              fetch(`${API_BASE_URL}/api/users/${userId}/bio`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (!userResp.ok || !profileResp.ok || !bioResp.ok) {
              console.warn(`Failed to hydrate candidate ${userId}`);
              return null;
            }

            const userData = await userResp.json();
            const profileData = await profileResp.json();
            const bioData = await bioResp.json();

            const [likedMovies, dislikedMovies, favActors, dislikedActors] = await Promise.all([
              Promise.all((bioData.favoriteMovies || []).map((mId: number) => fetchMovieDetails(mId))),
              Promise.all((bioData.dislikedMovies || []).map((mId: number) => fetchMovieDetails(mId))),
              Promise.all((bioData.favoriteActors || []).map((aId: number) => fetchActorDetails(aId))),
              Promise.all((bioData.dislikedActors || []).map((aId: number) => fetchActorDetails(aId))),
            ]);

            // Client-side distance calculation
            let distance = 0;
            if (myProfile && profileData.latitude && profileData.longitude && myProfile.latitude && myProfile.longitude) {
              const R = 6371; // km
              const dLat = (profileData.latitude - myProfile.latitude) * Math.PI / 180;
              const dLon = (profileData.longitude - myProfile.longitude) * Math.PI / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(myProfile.latitude * Math.PI / 180) * Math.cos(profileData.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              distance = R * c;
            }

            return {
              id: userId,
              name: userData.name,
              profilePicture: userData.profilePictureUrl,
              location: profileData.location || "Unknown Location",
              bio: profileData.bio || "No bio available",
              favoriteMovies: likedMovies,
              dislikedMovies: dislikedMovies,
              favoriteGenres: bioData.favoriteGenres || [],
              dislikedGenres: bioData.dislikedGenres || [],
              favoriteActors: favActors,
              dislikedActors: dislikedActors,
              distance: distance
            } as Recommendation;
          } catch (err) {
            console.error("Error processing candidate:", err);
            return null;
          }
        })
      );

      const finalRecs = enrichedRecs.filter(Boolean) as Recommendation[];
      setRecommendations(prev => [...prev, ...finalRecs]);
      if (finalRecs.length < 10) setHasMore(false);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Reset and fetch whenever maxDistance changes
    setRecommendations([]);
    setOffset(0);
    setCurrentIndex(0);
    setHasMore(true);
    fetchRecommendations(0);
  }, [maxDistance]);

  const handleLoadMore = () => {
    const nextOffset = offset + 10;
    setOffset(nextOffset);
    fetchRecommendations(nextOffset);
  };

  const handleLike = async () => {
    if (animating || currentIndex >= recommendations.length) return;
    const currentRec = recommendations[currentIndex];
    setAnimating(true);
    setSwipeDirection("right");

    try {
      const token = localStorage.getItem("authToken");
      const resp = await fetch(`${API_BASE_URL}/api/match/like/${currentRec.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.ok) {
        const result = await resp.json();

        if (result.mutualMatch) {
          // Merge the backend's chatId into the current user's profile data
          setLastMatchedUser({
            ...currentRec,
            chatId: result.chatId
          });
          setTimeout(() => setShowMatchOverlay(true), 500);
        }
      }
    } catch (err) {
      console.error("Like error:", err);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setAnimating(false);
      setSwipeDirection(null);
    }, 500);
  };

  const handleDismiss = async () => {
    if (animating || currentIndex >= recommendations.length) return;
    const currentRec = recommendations[currentIndex];
    setAnimating(true);
    setSwipeDirection("left");

    try {
      const token = localStorage.getItem("authToken");
      await fetch(`${API_BASE_URL}/api/match/decline/${currentRec.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Decline error:", err);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setAnimating(false);
      setSwipeDirection(null);
    }, 500);
  };

  // Unread Count from WebSocketContext
  const { unreadCount } = useWebSocket();

  const currentRec = recommendations[currentIndex];

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center aesthetic-effect-crt">
      <AlienBackground />
      <p className="text-4xl text-green-400 alien-glow animate-pulse font-mono" style={{ fontFamily: "Sevastopol Interface" }}>
        Finding your matches...
      </p>
    </div>
  );

  return (
    <div className="aesthetic-effect-crt overflow-y-auto min-h-screen pb-12">
      <AlienBackground />

      {/* MUTUAL MATCH OVERLAY */}
      {showMatchOverlay && lastMatchedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="border-8 border-green-500 p-8 max-w-lg w-full text-center bg-black relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>

            <h2 className="text-5xl text-green-400 alien-glow mb-2 vhs-distortion" style={{ fontFamily: "Sevastopol Interface" }}>
              IT'S A MATCH!
            </h2>
            <p className="text-green-500/60 mb-8 tracking-widest text-xs uppercase">Mutual Interest Confirmed</p>

            <div className="mb-8 relative inline-block">
              <img
                src={getDisplayImage(lastMatchedUser.profilePicture)}
                className="w-72 h-72 object-cover border-4 border-green-500 mx-auto grayscale contrast-150 brightness-75"
                alt="Matched User"
              />
              <div className="absolute inset-0 border-2 border-green-400 animate-ping opacity-20"></div>
            </div>

            <p className="text-4xl text-green-300 mb-10 uppercase font-bold" style={{ fontFamily: "Sevastopol Interface" }}>
              {lastMatchedUser.name}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  if (lastMatchedUser?.chatId) {
                    navigate(`/chat/${lastMatchedUser.chatId}`);
                  } else {
                    navigate('/chat'); // Fallback
                  }
                }}
                className="border-4 border-green-500 bg-green-600 py-4 text-black text-2xl font-bold alien-glow hover:bg-green-400 transition-all active:scale-95"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                Send Message
              </button>
              <button
                onClick={() => setShowMatchOverlay(false)}
                className="text-green-500/60 text-xl hover:text-green-400 transition-all uppercase tracking-tighter"
                style={{ fontFamily: "Sevastopol Interface" }}
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex flex-col md:flex-row relative z-10">
        {/* Sidebar */}
        <div className={`fixed md:static inset-0 md:inset-auto w-full md:w-64 bg-black/95 md:bg-black/90 border-r-4 border-green-500 p-6 flex flex-col gap-4 md:min-h-screen transition-transform duration-300 z-40 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="h-16 md:hidden"></div> {/* Spacer for burger menu */}
          {["ViewProfile", "EditProfile", "dashboard", "chat"].map((route) => (
            <button
              key={route}
              onClick={() => {
                if (route === "dashboard") navigate("/connections");
                else navigate(`/${route}`);
                setMobileMenuOpen(false);
              }}
              className="border-4 border-green-500 bg-transparent hover:bg-green-500/20 py-4 px-6 text-green-400 text-3xl font-bold alien-glow transition-all text-left uppercase relative"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              {route === "dashboard" ? "CONNECTIONS" : route === "chat" ?
                (
                  <>
                    CHATS
                    {unreadCount > 0 && <span className="absolute right-2 top-2 bg-red-600 text-white text-xs px-2 rounded-full alien-glow-red animate-pulse">{unreadCount}</span>}
                  </>
                )
                : route.replace("P", " P")}
            </button>
          ))}

          {/* Search Radius Slider */}
          <div className="mt-4 border-4 border-green-900 bg-black/50 p-4">
            <label
              className="block text-green-500 text-xs font-bold mb-2 uppercase tracking-widest"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              SEARCH RADIUS: {pendingDistance > 5000 ? "ANYWHERE" : `${pendingDistance} KM`}
            </label>
            <input
              type="range"
              min="50"
              max="5050"
              step="50"
              value={pendingDistance}
              onChange={(e) => setPendingDistance(parseInt(e.target.value))}
              className="w-full accent-green-500 h-1 bg-green-900 rounded-lg appearance-none cursor-pointer mb-4"
            />
            <button
              onClick={() => setMaxDistance(pendingDistance)}
              className="w-full border-2 border-green-500 bg-green-900/30 hover:bg-green-600 text-green-300 hover:text-black py-1 font-bold text-xs uppercase tracking-tighter"
              style={{ fontFamily: "Sevastopol Interface" }}
            >
              APPLY SCAN PARAMETERS
            </button>
          </div>

          <div className="flex-1"></div>
          <button onClick={async () => { await (window as any).disconnectSocket?.(); authService.logout(); navigate("/login"); setMobileMenuOpen(false); }} className="border-4 border-red-500 bg-transparent py-4 px-6 text-red-400 text-3xl font-bold alien-glow-red transition-all text-left" style={{ fontFamily: "Sevastopol Interface" }}>
            LOGOUT
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed top-4 left-4 z-50 border-4 border-green-500 bg-black/90 p-3 text-green-400 alien-glow"
          style={{ fontFamily: "Sevastopol Interface" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)} />
        )}

        <div className="flex-1 p-4 md:p-8 flex items-start md:items-center justify-center py-12 md:py-8">
          {!currentRec ? (
            <div className="text-center">
              {hasMore ? (
                <>
                  <p className="text-4xl text-green-400 alien-glow mb-6" style={{ fontFamily: "Sevastopol Interface" }}>
                    {loadingMore ? "DOWNLOADING MORE DATA..." : "STILL SCANNING..."}
                  </p>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="border-4 border-green-500 bg-green-600 px-8 py-3 text-black text-3xl font-bold alien-glow hover:bg-green-400 transition-all disabled:opacity-50"
                    style={{ fontFamily: "Sevastopol Interface" }}
                  >
                    {loadingMore ? "LOADING..." : "LOAD MORE"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-4xl text-green-400 alien-glow mb-6" style={{ fontFamily: "Sevastopol Interface" }}>No more users found</p>
                  <button onClick={() => navigate("/connections")} className="border-4 border-green-500 bg-green-600 px-8 py-3 text-black text-3xl font-bold alien-glow" style={{ fontFamily: "Sevastopol Interface" }}>View Connections</button>
                </>
              )}
            </div>
          ) : (
            <div className={`w-full max-w-4xl transition-all duration-500 ${swipeDirection === "right" ? "translate-x-[120%] opacity-0 rotate-12" : swipeDirection === "left" ? "-translate-x-[120%] opacity-0 -rotate-12" : ""}`}>
              <div className="border-4 border-green-400 alien-glow bg-black/90 backdrop-blur-sm p-3 md:p-8">

                <div className="text-center mb-4 md:mb-6">
                  <p className="text-xs text-green-400/60 mb-1 md:mb-2 uppercase tracking-widest" style={{ fontFamily: "Sevastopol Interface" }}>File {currentIndex + 1} of {recommendations.length}</p>
                  <h2 className="text-2xl md:text-5xl text-green-400 alien-glow vhs-distortion" style={{ fontFamily: "Sevastopol Interface" }}>PROFILE DETAILS</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4 md:mb-8 items-center md:items-start text-center md:text-left">
                  <div className="flex-shrink-0">
                    <img src={getDisplayImage(currentRec.profilePicture)} className="w-24 h-24 md:w-64 md:h-64 object-cover border-4 border-green-500 alien-glow mx-auto md:mx-0" alt="Profile" />
                  </div>

                  <div className="flex-1 space-y-2 md:space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 w-full">
                      {["NAME", "LOCATION", "DISTANCE"].map((label) => (
                        <div key={label} className="w-full">
                          <p className="text-xs md:text-sm text-green-400 font-bold mb-1" style={{ fontFamily: "Sevastopol Interface" }}>{label}:</p>
                          <div className="border-2 border-green-500 bg-black/50 p-2 text-green-300 text-xs md:text-xl font-sevastopol truncate">
                            {label === 'NAME' ? currentRec.name :
                              label === 'LOCATION' ? currentRec.location :
                                (currentRec.distance !== null && currentRec.distance !== undefined ? `${Math.round(currentRec.distance)} KM` : "N/A")}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="w-full mt-2 md:mt-4">
                      <p className="text-xs md:text-sm text-green-400 font-bold mb-1" style={{ fontFamily: "Sevastopol Interface" }}>BIO:</p>
                      <div className="border-2 border-green-500 bg-black/50 p-2 text-green-300 text-xs md:text-lg font-sevastopol h-20 md:h-48 overflow-y-auto whitespace-pre-wrap">
                        {currentRec.bio}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-6 mb-4 md:mb-8">
                  <div className="border-2 border-green-500 bg-black/50 p-2 md:p-4 h-32 md:h-64 overflow-y-auto">
                    <p className="text-xs md:text-2xl text-green-400 mb-2 md:mb-3 text-center border-b border-green-900 pb-2 font-sevastopol">POSITIVE</p>
                    <div className="space-y-2 md:space-y-4">
                      {currentRec.favoriteGenres.length > 0 && (
                        <div>
                          <p className="hidden md:block text-xs text-green-400 uppercase font-bold mb-1">Genres:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentRec.favoriteGenres.map(g => (
                              <span key={g} className="text-green-300 text-[10px] md:text-sm border border-green-500 px-1">{g}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(currentRec.favoriteMovies.length > 0 || currentRec.favoriteActors.length > 0) && (
                        <div className="space-y-2 md:space-y-4">
                          {currentRec.favoriteMovies.length > 0 && (
                            <div>
                              <p className="hidden md:block text-xs text-green-400 uppercase font-bold mb-1">Movies:</p>
                              <ul className="space-y-1">
                                {currentRec.favoriteMovies.map((m, i) => (
                                  <li key={`movie-${i}`} className="text-green-300 text-xs md:text-lg flex items-start gap-2">
                                    <span className="truncate">{m.title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentRec.favoriteActors.length > 0 && (
                            <div>
                              <p className="hidden md:block text-xs text-green-400 uppercase font-bold mb-1">Actors:</p>
                              <ul className="space-y-1">
                                {currentRec.favoriteActors.map((a, i) => (
                                  <li key={`actor-${i}`} className="text-green-300 text-xs md:text-lg flex items-start gap-2">
                                    <span className="truncate">{a.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-2 border-green-500 bg-black/50 p-2 md:p-4 h-32 md:h-64 overflow-y-auto">
                    <p className="text-xs md:text-2xl text-orange-500 alien-glow-red mb-2 md:mb-3 text-center border-b border-orange-900 pb-2 font-sevastopol">NEGATIVE</p>
                    <div className="space-y-2 md:space-y-4">
                      {currentRec.dislikedGenres.length > 0 && (
                        <div>
                          <p className="hidden md:block text-xs text-orange-400 alien-glow-red uppercase font-bold mb-1">Genres:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentRec.dislikedGenres.map(g => (
                              <span key={g} className="text-orange-400 text-[10px] md:text-sm border border-orange-500 px-1 alien-glow-red">{g}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(currentRec.dislikedMovies.length > 0 || currentRec.dislikedActors.length > 0) && (
                        <div className="space-y-2 md:space-y-4">
                          {currentRec.dislikedMovies.length > 0 && (
                            <div>
                              <p className="hidden md:block text-xs text-orange-400 alien-glow-red uppercase font-bold mb-1">Movies:</p>
                              <ul className="space-y-1">
                                {currentRec.dislikedMovies.map((m, i) => (
                                  <li key={`dmovie-${i}`} className="text-orange-400 text-xs md:text-lg flex items-start gap-2 alien-glow-red">
                                    <span className="truncate">{m.title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentRec.dislikedActors.length > 0 && (
                            <div>
                              <p className="hidden md:block text-xs text-orange-400 alien-glow-red uppercase font-bold mb-1">Actors:</p>
                              <ul className="space-y-1">
                                {currentRec.dislikedActors.map((a, i) => (
                                  <li key={`dactor-${i}`} className="text-orange-400 text-xs md:text-lg flex items-start gap-2 alien-glow-red">
                                    <span className="truncate">{a.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-6">
                  <button onClick={handleLike} className="border-4 border-green-500 bg-green-600 py-2 md:py-6 text-white text-lg md:text-3xl font-bold alien-glow hover:bg-green-400 transition-all font-sevastopol uppercase">LIKE</button>
                  <button onClick={handleDismiss} className="border-4 border-red-500 bg-red-600 py-2 md:py-6 text-white text-lg md:text-3xl font-bold alien-glow-red hover:bg-red-400 transition-all font-sevastopol uppercase">SKIP</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}

export default MainPage;
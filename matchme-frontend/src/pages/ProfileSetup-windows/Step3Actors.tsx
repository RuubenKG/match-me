import type { ProfileData, Actor } from "../../types/types";
import { useState } from "react";
import { API_BASE_URL } from "../../config";

interface Step3Props {
    profileData: ProfileData;
    setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
    onNext: () => void;
    onBack: () => void;
}

function Step3Actors({
    profileData,
    setProfileData,
    onNext,
    onBack,
}: Step3Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Actor[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setSearching(true);
            const response = await fetch(
                `${API_BASE_URL}/api/movies/actors/search?query=${encodeURIComponent(
                    searchQuery
                )}`
            );

            if (!response.ok) throw new Error("Failed to search actors");

            const data = await response.json();
            const people = data.results || [];

            const transformedActors = people.map((person: any) => {
                const path = person.profile_path;
                const fullProfileUrl = path
                    ? `https://image.tmdb.org/t/p/w300/${path.replace(/^\//, "")}`
                    : "https://via.placeholder.com/300x450?text=No+Photo";

                return {
                    id: person.id.toString(),
                    name: person.name,
                    profilePath: fullProfileUrl,
                };
            });

            setSearchResults(transformedActors);
        } catch (error) {
            console.error("Error searching actors:", error);
        } finally {
            setSearching(false);
        }
    };

    const addToLiked = (actor: Actor) => {
        if (profileData.favoriteActors.length >= 5) return;
        if (profileData.favoriteActors.some((a) => Number(a.id) === Number(actor.id))) return;

        if (profileData.dislikedActors.some((a) => Number(a.id) === Number(actor.id))) {
            alert("Remove from dislikes first.");
            return;
        }

        setProfileData({
            ...profileData,
            favoriteActors: [...profileData.favoriteActors, actor],
        });
    };

    const addToDisliked = (actor: Actor) => {
        if (profileData.dislikedActors.length >= 5) return;
        if (profileData.dislikedActors.some((a) => Number(a.id) === Number(actor.id))) return;

        if (profileData.favoriteActors.some((a) => Number(a.id) === Number(actor.id))) {
            alert("Remove from likes first.");
            return;
        }

        setProfileData({
            ...profileData,
            dislikedActors: [...profileData.dislikedActors, actor],
        });
    };

    const removeFromLiked = (index: number) => {
        const newLiked = profileData.favoriteActors.filter((_, i) => i !== index);
        setProfileData({ ...profileData, favoriteActors: newLiked });
    };

    const removeFromDisliked = (index: number) => {
        const newDisliked = profileData.dislikedActors.filter((_, i) => i !== index);
        setProfileData({ ...profileData, dislikedActors: newDisliked });
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto border-2 md:border-4 border-green-400 alien-glow p-4 md:p-8 my-2 md:my-4 bg-black/80 backdrop-blur-sm">
            <h2
                className="text-2xl md:text-3xl lg:text-5xl mb-4 md:mb-6 text-green-400 text-center alien-glow"
                style={{ fontFamily: "Sevastopol Interface" }}
            >
                SELECT ACTORS (MAX 5)
            </h2>

            {/* Search Bar */}
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 border-2 md:border-4 border-green-500/50 bg-black/50 p-2 md:p-4 text-lg md:text-2xl lg:text-3xl text-green-300 placeholder-green-700 focus:border-green-400 focus:outline-none"
                    style={{ fontFamily: "Sevastopol Interface" }}
                    placeholder="Search actors..."
                />
                <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="border-2 md:border-4 border-green-500 bg-green-600 hover:bg-green-700 px-6 md:px-8 py-2 md:py-4 text-black font-bold alien-glow transition-all text-sm md:text-base"
                    style={{ fontFamily: "Sevastopol Interface" }}
                >
                    {searching ? "SCANNING..." : "SEARCH"}
                </button>
            </div>

            {/* Vertical stacking for spacious results and lists */}
            <div className="flex flex-col gap-8 mb-6">
                {/* Search Results - Expanded to full width */}
                <div className="w-full border-2 md:border-4 border-green-500 bg-black/50 p-3 md:p-6 h-[400px] md:h-[600px] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                        {searchResults.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center h-[350px] md:h-[500px]">
                                <p
                                    style={{ fontFamily: "Sevastopol Interface" }}
                                    className="text-2xl md:text-3xl lg:text-4xl text-green-200 animate-pulse text-center px-4"
                                >
                                    READY FOR INPUT...
                                </p>
                            </div>
                        ) : (
                            searchResults.map((actor) => (
                                <div key={actor.id} className="border border-green-500 md:border-2 bg-black/70 group relative">
                                    <img src={actor.profilePath} alt={actor.name} className="w-full aspect-[2/3] object-cover" />
                                    <div className="p-1 md:p-2 bg-black/90">
                                        <p style={{ fontFamily: "Sevastopol Interface" }} className="text-xs md:text-sm lg:text-lg text-green-300 truncate">
                                            {actor.name}
                                        </p>
                                        <div className="flex gap-1 md:gap-2 mt-1 md:mt-2">
                                            <button onClick={() => addToLiked(actor)} className="flex-1 bg-green-900/30 border border-green-500 hover:bg-green-500 hover:text-black transition-all text-lg md:text-xl py-1 flex items-center justify-center" title="Like">👍</button>
                                            <button onClick={() => addToDisliked(actor)} className="flex-1 bg-red-900/30 border border-red-500 hover:bg-red-500 hover:text-black transition-all text-lg md:text-xl py-1 flex items-center justify-center" title="Dislike">👎</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Selected Lists - Side-by-side on tablet/desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {/* Liked Actors */}
                    <div className="bg-black/50 border-2 md:border-4 border-green-500 p-3 md:p-4">
                        <h3 className="text-green-400 text-xl md:text-2xl lg:text-3xl mb-4 border-b-2 border-green-900 pb-2" style={{ fontFamily: "Sevastopol Interface" }}>
                            LIKED ({profileData.favoriteActors.length}/5)
                        </h3>
                        <div className="space-y-2">
                            {profileData.favoriteActors.length === 0 && <p className="text-green-900 italic">EMPTY...</p>}
                            {profileData.favoriteActors.map((actor, i) => (
                                <div key={actor.id} className="flex justify-between items-center border border-green-500 p-2 bg-green-900/20 text-green-300 text-sm md:text-base" style={{ fontFamily: "Sevastopol Interface" }}>
                                    <span className="truncate pr-2">{actor.name}</span>
                                    <button onClick={() => removeFromLiked(i)} className="text-red-500 hover:text-red-400 font-bold transition-colors flex-shrink-0 text-xl" title="Remove">❌</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disliked Actors */}
                    <div className="bg-black/50 border-2 md:border-4 border-orange-500 p-3 md:p-4">
                        <h3 className="text-orange-400 text-xl md:text-2xl lg:text-3xl mb-4 border-b-2 border-orange-900 pb-2 alien-glow-red" style={{ fontFamily: "Sevastopol Interface" }}>
                            DISLIKED ({profileData.dislikedActors.length}/5)
                        </h3>
                        <div className="space-y-2">
                            {profileData.dislikedActors.length === 0 && <p className="text-orange-950 italic alien-glow-red">EMPTY...</p>}
                            {profileData.dislikedActors.map((actor, i) => (
                                <div key={actor.id} className="flex justify-between items-center border border-orange-500 p-2 bg-orange-900/20 text-orange-300 text-sm md:text-base alien-glow-red" style={{ fontFamily: "Sevastopol Interface" }}>
                                    <span className="truncate pr-2">{actor.name}</span>
                                    <button onClick={() => removeFromDisliked(i)} className="text-red-500 hover:text-red-400 font-bold transition-colors flex-shrink-0 text-xl" title="Remove">❌</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-8">
                <button onClick={onBack} className="border-2 md:border-4 border-green-500 px-6 md:px-8 py-2 md:py-3 text-green-400 hover:bg-green-500 hover:text-black font-bold transition-colors text-base md:text-lg" style={{ fontFamily: "Sevastopol Interface" }}>BACK</button>
                <button
                    onClick={onNext}
                    className="flex-1 border-2 md:border-4 border-green-500 bg-green-600 px-6 md:px-8 py-2 md:py-3 text-black font-bold hover:bg-green-500 transition-all text-base md:text-lg"
                    style={{ fontFamily: "Sevastopol Interface" }}
                >
                    PROCEED TO CONFIRMATION
                </button>
            </div>
        </div>
    );
}

export default Step3Actors;

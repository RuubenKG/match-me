import type { ProfileData } from "../../types/types";

interface Step2GenresProps {
    profileData: ProfileData;
    setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
    onNext: () => void;
    onBack: () => void;
}

const GENRES = [
    "Action", "Adventure", "Animation", "Comedy", "Crime",
    "Documentary", "Drama", "Family", "Fantasy", "History",
    "Horror", "Music", "Mystery", "Romance", "Science Fiction",
    "TV Movie", "Thriller", "War", "Western"
];

function Step2Genres({ profileData, setProfileData, onNext, onBack }: Step2GenresProps) {

    const toggleFavorite = (genre: string) => {
        let newFavs = [...profileData.favoriteGenres];
        if (newFavs.includes(genre)) {
            newFavs = newFavs.filter((g) => g !== genre);
        } else {
            // Remove from dislikes if present
            const newDislikes = profileData.dislikedGenres.filter(g => g !== genre);
            newFavs.push(genre);
            setProfileData({ ...profileData, favoriteGenres: newFavs, dislikedGenres: newDislikes });
            return;
        }
        setProfileData({ ...profileData, favoriteGenres: newFavs });
    };

    const toggleDisliked = (genre: string) => {
        let newDislikes = [...profileData.dislikedGenres];
        if (newDislikes.includes(genre)) {
            newDislikes = newDislikes.filter((g) => g !== genre);
        } else {
            // Remove from favorites if present
            const newFavs = profileData.favoriteGenres.filter(g => g !== genre);
            newDislikes.push(genre);
            setProfileData({ ...profileData, favoriteGenres: newFavs, dislikedGenres: newDislikes });
            return;
        }
        setProfileData({ ...profileData, dislikedGenres: newDislikes });
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto border-2 md:border-4 border-green-400 alien-glow p-4 md:p-8 my-2 md:my-4 bg-black/80 backdrop-blur-sm">
            <h2
                className="text-2xl md:text-3xl lg:text-5xl mb-4 md:mb-6 text-green-400 text-center alien-glow"
                style={{ fontFamily: "Sevastopol Interface" }}
            >
                CONFIGURE GENRE PREFERENCES
            </h2>

            {/* Vertical stacking for better spacing */}
            <div className="flex flex-col gap-8 md:gap-12">
                {/* Favorites and Dislikes - Side-by-side on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Favorites */}
                    <div className="bg-black/30 border-2 border-green-900/50 p-4 md:p-6 rounded-lg">
                        <h3 className="text-xl md:text-2xl lg:text-3xl mb-6 text-green-500 font-bold uppercase tracking-widest border-l-4 border-green-500 pl-4" style={{ fontFamily: "Sevastopol Interface" }}>
                            LIKED GENRES
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {GENRES.map((genre) => {
                                const isLiked = profileData.favoriteGenres.includes(genre);
                                return (
                                    <button
                                        key={`fav-${genre}`}
                                        onClick={() => toggleFavorite(genre)}
                                        className={`p-2 sm:p-3 border-2 transition-all text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider whitespace-normal break-words w-full h-auto min-h-[50px] md:min-h-[60px] flex items-center justify-center text-center leading-tight ${isLiked
                                            ? "bg-green-600 border-green-400 text-black alien-glow"
                                            : "bg-black/50 border-green-800 text-green-700 hover:border-green-500 hover:text-green-400"}`}
                                        style={{ fontFamily: "Sevastopol Interface" }}
                                    >
                                        {genre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dislikes */}
                    <div className="bg-black/30 border-2 border-orange-900/50 p-4 md:p-6 rounded-lg">
                        <h3 className="text-xl md:text-2xl lg:text-3xl mb-6 text-orange-500 alien-glow-red font-bold uppercase tracking-widest border-l-4 border-orange-500 pl-4" style={{ fontFamily: "Sevastopol Interface" }}>
                            DISLIKED GENRES
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {GENRES.map((genre) => {
                                const isDisliked = profileData.dislikedGenres.includes(genre);
                                return (
                                    <button
                                        key={`dis-${genre}`}
                                        onClick={() => toggleDisliked(genre)}
                                        className={`p-2 sm:p-3 border-2 transition-all text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider whitespace-normal break-words w-full h-auto min-h-[50px] md:min-h-[60px] flex items-center justify-center text-center leading-tight ${isDisliked
                                            ? "bg-orange-600 border-orange-400 text-black alien-glow-red"
                                            : "bg-black/50 border-orange-950 text-orange-900 alien-glow-red hover:border-orange-500 hover:text-orange-400"}`}
                                        style={{ fontFamily: "Sevastopol Interface" }}
                                    >
                                        {genre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8 md:mt-12">
                <button
                    onClick={onBack}
                    className="border-2 md:border-4 border-green-500 px-6 md:px-8 py-2 md:py-3 text-green-400 hover:bg-green-500 hover:text-black font-bold transition-colors text-base md:text-lg"
                    style={{ fontFamily: "Sevastopol Interface" }}
                >
                    BACK
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 border-2 md:border-4 border-green-500 bg-green-600 px-6 md:px-8 py-2 md:py-3 text-black font-bold hover:bg-green-500 transition-all text-base md:text-lg"
                    style={{ fontFamily: "Sevastopol Interface" }}
                >
                    PROCEED TO MOVIES
                </button>
            </div>
        </div>
    );
}

export default Step2Genres;

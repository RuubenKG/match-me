import type { ProfileData, Movie, Actor } from "../../types/types.ts";
import { API_BASE_URL } from "../../config";

interface Step3Props {
  profileData: ProfileData;
  onSubmit: () => void;
  onBack: () => void;
}

function Step3Confirmation({ profileData, onSubmit, onBack }: Step3Props) {
  const getPreviewUrl = (pic: File | string | null): string => {
    if (!pic) return "/default-alien-avatar.png";
    if (pic instanceof File) {
      return URL.createObjectURL(pic);
    }
    return `${API_BASE_URL}/user-photos/${pic}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto border-2 md:border-4 border-green-400 alien-glow p-4 md:p-8 my-2 md:my-4 bg-black/80 backdrop-blur-sm">
      <h2
        className="text-2xl md:text-3xl lg:text-5xl mb-4 md:mb-8 text-green-400 text-center alien-glow font-sevastopol"
      >
        CONFIGURATION OVERVIEW
      </h2>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 mb-4 md:mb-8">
        <div className="w-full lg:w-[400px] flex-shrink-0 space-y-8">
          {/* Profile Picture */}
          <div>
            <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 md:mb-4 text-green-400 font-sevastopol">
              Profile Picture:
            </p>
            <img
              src={getPreviewUrl(profileData.profilePicture)}
              alt="Profile"
              className="w-48 h-48 md:w-64 md:h-64 mx-auto lg:mx-0 object-cover border-2 md:border-4 border-green-500 alien-glow"
            />
          </div>

          {/* Genres Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-green-400 font-sevastopol">Liked Genres:</p>
              <div className="flex flex-wrap gap-2">
                {profileData.favoriteGenres.length > 0 ? profileData.favoriteGenres.map(g => (
                  <span key={g} className="border border-green-500 bg-green-900/30 px-2 py-1 text-sm text-green-300 font-sevastopol">{g}</span>
                )) : <span className="text-green-800 text-sm italic font-sevastopol">N/A</span>}
              </div>
            </div>
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-orange-500 alien-glow-red font-sevastopol">Disliked Genres:</p>
              <div className="flex flex-wrap gap-2">
                {profileData.dislikedGenres.length > 0 ? profileData.dislikedGenres.map(g => (
                  <span key={g} className="border border-orange-500 bg-orange-900/30 px-2 py-1 text-sm text-orange-400 font-sevastopol alien-glow-red">{g}</span>
                )) : <span className="text-orange-900 alien-glow-red text-sm italic font-sevastopol">NONE</span>}
              </div>
            </div>
          </div>

          {/* Actors Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 border-t-2 border-green-900 pt-6">
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-green-400 font-sevastopol">Liked Actors:</p>
              <ul className="list-disc list-inside space-y-1">
                {profileData.favoriteActors.map((actor: Actor, index: number) => (
                  <li key={index} className="text-base text-green-300 font-sevastopol">{actor.name}</li>
                ))}
                {profileData.favoriteActors.length === 0 && <li className="text-green-800 italic">None</li>}
              </ul>
            </div>
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-orange-500 alien-glow-red font-sevastopol">Disliked Actors:</p>
              <ul className="list-disc list-inside space-y-1">
                {profileData.dislikedActors.map((actor: Actor, index: number) => (
                  <li key={index} className="text-base text-orange-400 font-sevastopol alien-glow-red">{actor.name}</li>
                ))}
                {profileData.dislikedActors.length === 0 && <li className="text-orange-900 alien-glow-red italic">None</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Center/Right: Movies and Bio */}
        <div className="flex-1 space-y-8 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-green-400 font-sevastopol">Movies you like:</p>
              <ul className="list-disc list-inside space-y-1">
                {profileData.favoriteMovies.map((movie: Movie, index: number) => (
                  <li key={index} className="text-lg text-green-300 font-sevastopol">{movie.title} ({movie.year})</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-orange-500 alien-glow-red font-sevastopol">Movies you dislike:</p>
              <ul className="list-disc list-inside space-y-1">
                {profileData.dislikedMovies.map((movie: Movie, index: number) => (
                  <li key={index} className="text-lg text-orange-400 font-sevastopol alien-glow-red">{movie.title} ({movie.year})</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-green-400 font-sevastopol">Name:</p>
              <div className="border-2 md:border-4 border-green-500 p-3 bg-black/50 text-xl text-green-300 font-sevastopol">{profileData.name}</div>
            </div>
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-green-400 font-sevastopol">Location:</p>
              <div className="border-2 md:border-4 border-green-500 p-3 bg-black/50 text-xl text-green-300 font-sevastopol">{profileData.location}</div>
            </div>
            <div>
              <p className="font-bold text-xl md:text-2xl lg:text-3xl mb-2 text-green-400 font-sevastopol">Bio:</p>
              <div className="border-2 md:border-4 border-green-500 p-3 bg-black/50 h-[250px] overflow-y-auto text-lg text-green-300 font-sevastopol whitespace-pre-wrap">{profileData.bio}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-8">
        <button
          onClick={onBack}
          className="border-2 md:border-4 border-green-500 bg-green-900/50 hover:bg-green-700 px-6 md:px-8 py-2 md:py-3 text-green-300 hover:text-white text-lg md:text-xl lg:text-2xl font-bold alien-glow transition-all font-sevastopol"
        >
          BACK
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 border-2 md:border-4 border-green-500 bg-green-600 hover:bg-green-700 px-6 md:px-8 py-2 md:py-3 text-black hover:text-white text-lg md:text-xl lg:text-2xl font-bold alien-glow transition-all transform hover:scale-105 font-sevastopol"
        >
          CONFIRM PROFILE
        </button>
      </div>
    </div>
  );
}

export default Step3Confirmation;
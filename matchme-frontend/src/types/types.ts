export interface Movie {
    id: string | number;
    title: string;
    posterUrl: string;
    year?: number | string;
}

export interface Actor {
    id: string | number;
    name: string;
    profilePath: string;
}

export interface ProfileData {
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    bio: string;
    email?: string | null;
    profilePicture: File | string | null;
    favoriteMovies: Movie[];
    dislikedMovies: Movie[];
    favoriteGenres: string[];
    dislikedGenres: string[];
    favoriteActors: Actor[];
    dislikedActors: Actor[];
    removePhoto?: boolean;
    maxDistance?: number;
}

export interface UserBasicDto {
    id: number;
    name: string;
    profilePictureUrl: string | null;
}
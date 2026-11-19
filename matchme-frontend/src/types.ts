export type Role = 'USER' | 'ADMIN';

export interface UserPreferences {
    id: number;
    preferredGenres: string[]; // Adjust types (string vs object) based on your Java Enums
    preferredDecades: string[];
    minRating: number;
}

export interface UserProfile {
    id: number;
    bio: string;
    profilePictureUrl: string;
    location: string;
    favoriteMovies: string[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: Role;
    userProfile?: UserProfile;       // Optional because of Lazy loading
    userPreferences?: UserPreferences; // Optional because of Lazy loading
}

// This matches the DTO we used in the MatchController
export interface CandidateProfileDto {
    user: User;
    score: number;
}

// This matches the result of a swipe
export interface MatchResultDto {
    isMutualMatch: boolean;
    targetUserId: number;
    message: string;
}

// This matches our new /status endpoint
export interface ConnectionStatusDto {
    userId: number;
    status: 'PENDING' | 'CONNECTED' | 'REJECTED' | 'DISMISSED_BY_A' | 'DISMISSED_BY_B';
    connectionId: number;
}
export interface ProfileResponse {
  id: string;
  name: string;
  location: string;
  bio: string;
  profilePicture: string;
  favoriteMovies: string[];
  dislikedMovies: string[];
}

export interface MatchResponse {
  isMatch: boolean;
  matchedUser?: {
    id: string;
    name: string;
    profilePicture: string;
  };
}

export interface MatchListItem {
  id: string;
  name: string;
  profilePicture: string;
  lastMessage?: string;
}

// Mock data for testing
const MOCK_PROFILES: ProfileResponse[] = [
  {
    id: "1",
    name: "Alex Johnson",
    location: "New York, NY",
    bio: "Movie buff and aspiring filmmaker. Love discussing cinematography and plot twists!",
    profilePicture: "https://i.pravatar.cc/300?img=1",
    favoriteMovies: [
      "The Godfather",
      "Pulp Fiction",
      "Inception",
      "The Dark Knight",
      "Interstellar",
    ],
    dislikedMovies: [
      "Cats",
      "The Emoji Movie",
      "Twilight",
      "Sharknado",
      "The Room",
    ],
  },
  {
    id: "2",
    name: "Sam Chen",
    location: "San Francisco, CA",
    bio: "Tech enthusiast who loves sci-fi movies and indie films. Always up for a movie marathon!",
    profilePicture: "https://i.pravatar.cc/300?img=2",
    favoriteMovies: ["Blade Runner 2049", "Ex Machina", "Her", "Arrival", "Dune"],
    dislikedMovies: [
      "Transformers",
      "Fast & Furious 9",
      "Suicide Squad",
      "Batman v Superman",
      "Justice League",
    ],
  },
  {
    id: "3",
    name: "Jordan Taylor",
    location: "Los Angeles, CA",
    bio: "Horror movie fanatic and popcorn connoisseur. Let's watch something scary together!",
    profilePicture: "https://i.pravatar.cc/300?img=3",
    favoriteMovies: [
      "The Shining",
      "Get Out",
      "Hereditary",
      "A Quiet Place",
      "Midsommar",
    ],
    dislikedMovies: [
      "Scary Movie 5",
      "The Happening",
      "The Bye Bye Man",
      "Slenderman",
      "Truth or Dare",
    ],
  },
];

const MOCK_MATCHES: MatchListItem[] = [
  {
    id: "101",
    name: "Casey Smith",
    profilePicture: "https://i.pravatar.cc/50?img=4",
    lastMessage: "Hey! Have you seen the new Nolan film?",
  },
  {
    id: "102",
    name: "Riley Brown",
    profilePicture: "https://i.pravatar.cc/50?img=5",
    lastMessage: "I loved that movie too!",
  },
];

class MatchingService {
  private baseURL = "/api";
  private USE_MOCK_DATA = true; // Set to false when backend is ready
  private currentProfileIndex = 0;

  async getNextProfile(): Promise<ProfileResponse | null> {
    // Use mock data if enabled
    if (this.USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      if (this.currentProfileIndex >= MOCK_PROFILES.length) {
        return null; // No more profiles
      }

      const profile = MOCK_PROFILES[this.currentProfileIndex];
      this.currentProfileIndex++;
      return profile;
    }

    // Real API call
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${this.baseURL}/profiles/next`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("failed to fetch profile");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching next profile", error);
      throw error;
    }
  }

  async likeProfile(targetUserId: string): Promise<MatchResponse> {
    // Use mock data if enabled
    if (this.USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

      // 30% chance of match for demo purposes
      const isMatch = Math.random() < 0.3;

      if (isMatch) {
        return {
          isMatch: true,
          matchedUser: {
            id: targetUserId,
            name: "Mock Matched User",
            profilePicture: "https://i.pravatar.cc/300?img=10",
          },
        };
      }

      return { isMatch: false };
    }

    // Real API call
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${this.baseURL}/swipe/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to send like");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("error sending like:", error);
      throw error;
    }
  }

  async dislikeProfile(targetUserId: string): Promise<void> {
    // Use mock data if enabled
    if (this.USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay
      console.log("Disliked profile:", targetUserId);
      return;
    }

    // Real API call
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${this.baseURL}/swipe/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to send dislike");
      }
    } catch (error) {
      console.error("error sending dislike:", error);
      throw error;
    }
  }

  async getMatches(): Promise<MatchListItem[]> {
    // Use mock data if enabled
    if (this.USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay
      return MOCK_MATCHES;
    }

    // Real API call
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${this.baseURL}/matches`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("error fetching matches:", error);
      throw error;
    }
  }

  // Helper method to reset mock data (for testing)
  resetMockData() {
    this.currentProfileIndex = 0;
  }

  // Helper method to switch between mock and real data
  setUseMockData(useMock: boolean) {
    this.USE_MOCK_DATA = useMock;
  }
}

export const matchingService = new MatchingService();

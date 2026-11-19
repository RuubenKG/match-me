package com.matchme.config;

import com.matchme.enums.Role;
import com.matchme.entity.User;
import com.matchme.entity.UserProfile;
import com.matchme.entity.UserPreferences;
import com.matchme.repository.UserPreferencesRepository;
import com.matchme.service.UserService;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class DataInitializer implements CommandLineRunner {

        private final UserService userService;
        private final UserPreferencesRepository userPreferencesRepository;

        public DataInitializer(UserService userService, UserPreferencesRepository userPreferencesRepository) {
                this.userService = userService;
                this.userPreferencesRepository = userPreferencesRepository;
        }

        // --- Data Pools for Randomization ---
        private static final Random RANDOM = new Random();
        private static final List<String> CITIES = List.of("Tallinn", "Tartu", "Narva", "Pärnu", "Viljandi",
                        "Kuressaare",
                        "Rakvere");
        private static final Map<String, double[]> CITY_COORDINATES = Map.of(
                        "Tallinn", new double[] { 59.4370, 24.7536 },
                        "Tartu", new double[] { 58.3780, 26.7290 },
                        "Narva", new double[] { 59.3797, 28.1791 },
                        "Pärnu", new double[] { 58.3853, 24.5007 },
                        "Viljandi", new double[] { 58.3639, 25.5900 },
                        "Kuressaare", new double[] { 58.2550, 22.4919 },
                        "Rakvere", new double[] { 59.3461, 26.3558 });
        private static final List<String> GENRES = List.of("Action", "Comedy", "Sci-Fi", "Horror", "Thriller",
                        "Romance",
                        "Drama", "Documentary", "Fantasy", "Animation");
        private static final List<String> DECADES = List.of("1970s", "1980s", "1990s", "2000s", "2010s", "2020s");

        // REAL TMDB IDs so your frontend actually shows posters!
        private static final List<Long> MOVIE_IDS = List.of(
                        550L, 155L, 680L, 424L, 13L, 603L, 157336L, 27205L, 12L, 11L, // Matrix, Dark Knight,
                                                                                      // Interstellar, etc.
                        120L, 121L, 122L, 597L, 8587L, 238L, 278L, 671L, 672L, 673L, // LOTR, Titanic, Lion King,
                                                                                     // Godfather
                        299536L, 299534L, 389L, 19995L, 24428L, 99861L, 283995L, 354912L // Avengers, Avatar, Coco
        );

        // REAL TMDB IDs for Actors
        private static final List<Long> ACTOR_IDS = List.of(
                        287L, 1158L, 3896L, 1204L, 31L, 103L, 2227L, 1283L, // Brad Pitt, Al Pacino, Liam Neeson, Julia
                                                                            // Roberts, Tom Hanks, Mark Hamill,
                                                                            // Harrison Ford, Helena Bonham Carter
                        139L, 204L, 500L, 192L, 62L, 73421L, 11701L, 1373737L // Uma Thurman, Clint Eastwood, Tom
                                                                              // Cruise, Morgan Freeman, Bruce Willis,
                                                                              // Paul Walker, Angelina Jolie, Robert
                                                                              // Downey Jr.
        );

        // REAL TMDB IDs for Directors
        private static final List<Long> DIRECTOR_IDS = List.of(
                        138L, 1032L, 5655L, 216L, 1L, 108L, 1223L, 488L, // Quentin Tarantino, Martin Scorsese, Wes
                                                                         // Anderson, Michael Bay, George Lucas, Steven
                                                                         // Spielberg, Tim Burton, Christopher Nolan
                        2636L, 7467L, 578L, 510L, 12453L, 24L, 3331L, 1226L // Alfred Hitchcock, David Fincher, Ridley
                                                                            // Scott, James Cameron, Stanley Kubrick,
                                                                            // Robert Zemeckis, Sofia Coppola, Woody
                                                                            // Allen
        );

        // Random Bios to make the UI look populated
        private static final List<String> BIOS = List.of(
                        "Film student looking for a co-pilot.",
                        "I only watch movies in black and white.",
                        "Sci-fi geek. Let's debate Star Trek vs Star Wars.",
                        "Just looking for someone to watch Netflix with.",
                        "Horror fanatic. Don't be scared.",
                        "I judge people by their favorite Tarantino movie.",
                        "Popcorn is my love language.",
                        "Looking for the plot twist in my life.");

        private static final int NUM_RANDOM_USERS = 96; // Generate 96 users to reach 100 total

        @Override
        @Transactional
        public void run(String... args) {
                // Prevent re-running if data exists
                if (userService.existsByEmail("alicey@example.com")) {
                        System.out.println("Database already initialized. Skipping Data Generation.");
                        return;
                }

                System.out.println("Initializing Test Data...");

                // --- 1. Load 4 Essential Functional Test Users (IDs 1-4) ---

                // Alice (ID 1)
                createFunctionalUser("alicey@example.com", "Alice", "Tallinn", "1995-06-14",
                                List.of("Action", "Sci-Fi"), List.of("Romance"), List.of(550L, 680L), List.of(24428L),
                                List.of("1990s"),
                                "I love The Matrix.");

                // Bob (ID 2)
                createFunctionalUser("bob@example.com", "Bob", "Tartu", "1993-04-20",
                                List.of("Comedy", "Thriller"), List.of("Horror"), List.of(13L, 120L), List.of(424L),
                                List.of("1980s"),
                                "Comedy gold only.");

                // Charlie (ID 3) - Perfect Match for Alice
                createFunctionalUser("charlie@example.com", "Charlie", "Tallinn", "1990-02-10",
                                List.of("Action", "Sci-Fi"), List.of("Drama"), List.of(550L, 680L, 27205L),
                                List.of(12L),
                                List.of("1990s"), "Sci-Fi is life.");

                // Anti-Match (ID 4) - Anti-Match for Alice
                createFunctionalUser("antimatch@example.com", "Anti", "Tallinn", "1992-09-05",
                                List.of("Documentary"), List.of("Action", "Sci-Fi"), List.of(99861L),
                                List.of(550L, 680L),
                                List.of("2000s"), "I hate sci-fi.");

                // --- 2. Load High-Volume Random Users ---
                for (int i = 0; i < NUM_RANDOM_USERS; i++) {
                        createRandomUser();
                }

                System.out.println(
                                String.format("Data Load Complete: %d functional and %d random users created.", 4,
                                                NUM_RANDOM_USERS));
        }

        /**
         * Helper to create functional test users.
         */
        private void createFunctionalUser(String email, String firstName, String location, String dob,
                        List<String> favGenres, List<String> disGenres, List<Long> favMovies,
                        List<Long> disMovies, List<String> favDecades, String bio) {

                // 1. Create Base User
                User user = User.builder()
                                .email(email)
                                .username(firstName.toLowerCase())
                                .password("password") // UserService will encode this
                                .role(Role.USER)
                                .build();

                // 2. Create Profile
                double[] coords = CITY_COORDINATES.getOrDefault(location, new double[] { 59.4370, 24.7536 });
                UserProfile profile = UserProfile.builder()
                                .firstName(firstName)
                                .lastName("TestUser")
                                .dateOfBirth(LocalDate.parse(dob))
                                .location(location)
                                .latitude(coords[0])
                                .longitude(coords[1])
                                .bio(bio)
                                .user(user)
                                .build();
                user.setUserProfile(profile);

                // 3. Save User (Cascades profile)
                user = userService.saveUser(user);

                // Helper to ensure 5 items and no overlaps
                List<Long> finalFavMovies = fillRest(favMovies, MOVIE_IDS, 5, Collections.emptyList());
                List<Long> finalDisMovies = fillRest(disMovies, MOVIE_IDS, 5, finalFavMovies);

                List<Long> finalFavActors = getRandomSubset(ACTOR_IDS, 5);
                List<Long> finalDisActors = getRandomSubsetExcluding(ACTOR_IDS, 3, finalFavActors); // Actors can be 3
                                                                                                    // for now, or 5?
                                                                                                    // User said "those
                                                                                                    // both being 5 out
                                                                                                    // of 5" likely
                                                                                                    // referring to
                                                                                                    // movies/actors.
                                                                                                    // Let's aim for 5/5
                                                                                                    // for actors too to
                                                                                                    // be
                                                                                                    // safe/consistent?
                                                                                                    // The UI implies 5.
                // Re-reading: "You can't create a profile without those both being 5 out of 5".
                // Usually refers to Step2Movies and Step3Actors.
                // Let's upgrade Actors to 5/5 as well for safety.

                finalFavActors = getRandomSubset(ACTOR_IDS, 5);
                finalDisActors = getRandomSubsetExcluding(ACTOR_IDS, 5, finalFavActors);

                // 4. Create Preferences
                UserPreferences prefs = UserPreferences.builder()
                                .user(user)
                                .location(profile.getLocation())
                                .favoriteGenres(fillRest(favGenres, GENRES, 5, Collections.emptyList()))
                                .dislikedGenres(fillRest(disGenres, GENRES, 3,
                                                favGenres != null ? favGenres : Collections.emptyList()))
                                .favoriteMovies(finalFavMovies)
                                .dislikedMovies(finalDisMovies)
                                .favoriteDecades(favDecades != null ? favDecades : getRandomSubset(DECADES, 3))
                                .dislikedDecades(getRandomSubset(DECADES, 2))
                                .favoriteActors(finalFavActors)
                                .dislikedActors(finalDisActors)
                                .favoriteDirectors(getRandomSubset(DIRECTOR_IDS, 3))
                                .dislikedDirectors(getRandomSubset(DIRECTOR_IDS, 2))
                                .build();

                // 5. Save Preferences
                user.setUserPreferences(prefs);
                this.userPreferencesRepository.save(prefs);
        }

        /**
         * Helper to create random users for stress test.
         */
        private void createRandomUser() {
                String uuid = UUID.randomUUID().toString().substring(0, 8);
                String email = "user_" + uuid + "@matchme.com";
                String firstName = "User" + uuid;

                User user = User.builder()
                                .email(email)
                                .username(firstName)
                                .password("password")
                                .role(Role.USER)
                                .build();

                String location = CITIES.get(RANDOM.nextInt(CITIES.size()));
                double[] coords = CITY_COORDINATES.get(location);

                UserProfile profile = UserProfile.builder()
                                .firstName(firstName)
                                .lastName("Random")
                                .dateOfBirth(generateRandomDOB())
                                .bio(BIOS.get(RANDOM.nextInt(BIOS.size())))
                                .location(location)
                                .latitude(coords[0])
                                .longitude(coords[1])
                                .user(user)
                                .build();
                user.setUserProfile(profile);

                user = userService.saveUser(user);

                // Smart Random Selection: Ensure no overlap between Favs and Dislikes
                List<Long> shuffledMovies = new ArrayList<>(MOVIE_IDS);
                Collections.shuffle(shuffledMovies, RANDOM);
                List<Long> favMovies = shuffledMovies.subList(0, 5);
                List<Long> disMovies = shuffledMovies.subList(5, 10);

                List<Long> shuffledActors = new ArrayList<>(ACTOR_IDS);
                Collections.shuffle(shuffledActors, RANDOM);
                List<Long> favActors = shuffledActors.subList(0, 5);
                List<Long> disActors = shuffledActors.subList(5, 10);

                UserPreferences prefs = UserPreferences.builder()
                                .user(user)
                                .location(profile.getLocation())
                                .favoriteGenres(getRandomSubset(GENRES, 5))
                                .dislikedGenres(getRandomSubset(GENRES, 5)) // Actually this might overlap? Fixing
                                                                            // genres too just in case
                                // For genres:
                                .favoriteMovies(favMovies)
                                .dislikedMovies(disMovies)
                                .favoriteDecades(getRandomSubset(DECADES, 3))
                                .dislikedDecades(getRandomSubset(DECADES, 2))
                                .favoriteActors(favActors)
                                .dislikedActors(disActors)
                                .favoriteDirectors(getRandomSubset(DIRECTOR_IDS, 5))
                                .dislikedDirectors(getRandomSubset(DIRECTOR_IDS, 3))
                                .build();

                // Fix Genres overlap for random users
                List<String> shuffledGenres = new ArrayList<>(GENRES);
                Collections.shuffle(shuffledGenres, RANDOM);
                prefs.setFavoriteGenres(shuffledGenres.subList(0, 5));
                prefs.setDislikedGenres(shuffledGenres.subList(5, Math.min(8, shuffledGenres.size()))); // 3 dislikes

                user.setUserPreferences(prefs);
                this.userPreferencesRepository.save(prefs);
        }

        // --- Utilities ---

        // Helper to fill a list to 'size' with random items from 'source', excluding
        // 'exclude'
        private <T> List<T> fillRest(List<T> current, List<T> source, int targetSize, List<T> exclude) {
                List<T> result = current != null ? new ArrayList<>(current) : new ArrayList<>();
                List<T> pool = new ArrayList<>(source);
                pool.removeAll(result);
                if (exclude != null)
                        pool.removeAll(exclude);
                Collections.shuffle(pool, RANDOM);

                while (result.size() < targetSize && !pool.isEmpty()) {
                        result.add(pool.remove(0));
                }
                return result;
        }

        private <T> List<T> getRandomSubset(List<T> sourceList, int size) {
                if (size <= 0)
                        return new ArrayList<>();
                List<T> copy = new ArrayList<>(sourceList);
                Collections.shuffle(copy, RANDOM);
                return copy.subList(0, Math.min(size, copy.size()));
        }

        private <T> List<T> getRandomSubsetExcluding(List<T> sourceList, int size, List<T> exclude) {
                List<T> pool = new ArrayList<>(sourceList);
                pool.removeAll(exclude);
                Collections.shuffle(pool, RANDOM);
                return pool.subList(0, Math.min(size, pool.size()));
        }

        private LocalDate generateRandomDOB() {
                long minDay = LocalDate.of(1990, 1, 1).toEpochDay();
                long maxDay = LocalDate.of(2002, 1, 1).toEpochDay();
                long randomDay = ThreadLocalRandom.current().nextLong(minDay, maxDay);
                return LocalDate.ofEpochDay(randomDay);
        }
}
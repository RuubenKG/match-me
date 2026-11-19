# Match-Me Movies — API Flow Design

This document describes how the API is used in sequence across the main features of the Match-Me Movies platform.  
Each flow lists the frontend → backend → database → response path and the relevant endpoints.

---

## 1. Registration Flow

Goal: Let a new user sign up with an email, password, and name.

### Sequence
1. Frontend: User fills sign-up form (email, password, name).
2. POST /auth/register  
   - Backend validates input, hashes password with bcrypt, saves to PostgreSQL.
3. Backend → DB: Insert new users record.
4. Response (201 Created):
   ```json
   { "id": 1, "email": "user@example.com", "name": "Alice" }
   ```
5. Frontend: Shows “Account created!” and redirects to /login.

---

## 2. Login & Authentication Flow

Goal: Authenticate user and store JWT.

### Sequence
1. Frontend: User submits login form.
2. POST /auth/login  
   - Verifies credentials.  
   - Returns a signed JWT and basic user info.
3. Frontend:  
   - Saves token to localStorage or httpOnly cookie.  
   - Redirects user to /dashboard.
4. Subsequent requests include header:  
   ```
   Authorization: Bearer <token>
   ```

---

## 3. Profile Setup Flow

Goal: Force user to complete their profile before using recommendations.

### Sequence
1. Frontend: Checks if profile complete (via /auth/me → /users/:id/profile).
2. If incomplete, show “Complete your profile” screen.
3. PUT /me/profile  
   User submits:
   ```json
   {
     "about": "Movie buff!",
     "favoriteGenres": ["Drama", "Comedy"],
     "favoriteMovies": ["The Matrix", "Her"],
     "favoriteDirector": "Christopher Nolan",
     "location": "Berlin",
     "lookingFor": "Friends who love sci-fi"
   }
   ```
4. Backend: Updates user profile in DB.
5. Response:
   ```json
   { "message": "Profile updated successfully." }
   ```

---

## 4. Upload Profile Picture

Goal: Add/change a user’s picture.

### Sequence
1. Frontend: User uploads file.
2. POST /me/profile-picture (multipart/form-data)
3. Backend:  
   - Validates file type/size.  
   - Saves file to /uploads directory.  
   - Updates DB with profilePic path.
4. Response:
   ```json
   { "profilePic": "/uploads/user123.jpg" }
   ```
5. Frontend: Immediately updates UI avatar.

---

## 5. Recommendations Flow

Goal: Generate and display the top 10 user matches.

### Sequence
1. Frontend: Calls GET /recommendations
2. Backend:  
   - Retrieves user’s bio (movie preferences, location, etc.).  
   - Scores other users based on similarity (cosine similarity / weighted average).  
   - Filters out dismissed or faraway users.  
   - Returns:
     ```json
     {
       "recommendations": [
         { "id": 4, "matchScore": 0.92 },
         { "id": 7, "matchScore": 0.88 }
       ]
     }
     ```
3. Frontend: For each id:  
   - Fetch /users/:id  
   - Fetch /users/:id/bio  
   - Merge results for display.
4. User can connect or dismiss.

---

## 6. Connection Request Flow

Goal: Let users send and accept match requests.

### Send Request
1. Frontend: Clicks “Connect”.
2. POST /connections/request  
   ```json
   { "targetUserId": 4 }
   ```
3. Backend: Adds to connections table as pending.
4. Response:  
   ```json
   { "message": "Connection request sent." }
   ```

### Accept Request
1. Frontend: Calls GET /connections/requests to show pending requests.
2. POST /connections/accept  
   ```json
   { "fromUserId": 4 }
   ```
3. Backend: Marks request as accepted.
4. Response:  
   ```json
   { "message": "Connection accepted." }
   ```

---

## 7. Chat Flow (Real-Time)

Goal: Enable messaging between connected users.

### WebSocket Initialization
1. Frontend: Opens socket connection on /chat after login.
2. Backend: Verifies JWT during socket handshake.

### Fetch Chat List
- GET /chats  
  Returns all user conversations with last message and unread status.

### Start or Resume Chat
1. Frontend: Clicks on connection → open chat view.
2. GET /chats/:userId  
   Loads chat history (paginated).

### Send Message
1. Frontend: Emits send_message event via WebSocket.
   ```json
   { "to": 4, "text": "Wanna watch Blade Runner 2049?" }
   ```
2. Backend: Broadcasts to recipient’s socket if online.
3. DB: Saves message to messages table.
4. Frontend: Appends message immediately.
5. Recipient Frontend: Shows real-time message + unread badge.

---

## 8. Online & Typing Indicators

Goal: Show presence and typing states.

### Online Presence
- Backend keeps a list of active socket connections.  
- Emits user_online / user_offline events to connected clients.

### Typing
1. Frontend: On input change → emits typing event.
2. Backend: Relays event to chat partner.
3. Frontend (receiver): Shows “User is typing…” until event stops.

---

## 9. Healthcheck & Admin Flow

Goal: Verify that backend and database are operational.

### Sequence
- GET /  
  ```json
  { "status": "OK", "message": "Match-Me backend running" }
  ```
- Used for CI/CD health checks and frontend “server unavailable” state.

---

## Database Entities (Simplified)

| Table | Description |
|-------|--------------|
| users | Basic account info (email, passwordHash, name) |
| profiles | Extended info (bio, genres, favorites, etc.) |
| connections | Connection requests and accepted links |
| messages | Chat message history |

---

## Summary

The API flow supports a secure, scalable, and reactive matchmaking system with:
- JWT-based session management  
- Strongly typed data for React frontend  
- Real-time socket messaging  
- Modular endpoints to allow expansion (e.g., movies, events, clubs)

---

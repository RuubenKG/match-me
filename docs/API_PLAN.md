# Match-Me Movies - API Plan

This document defines the REST API design for the **Match-Me Movies** application.  
It outlines all endpoints, their purpose, input/output formats, and authentication rules.  

---

## Overview

Base URL:  
```
http://localhost:5000/api
```

All responses are JSON.  
All protected routes require a valid JWT sent as an **Authorization header**:  
```
Authorization: Bearer <token>
```

---

## AUTHENTICATION

### `POST /auth/register`
Create a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Alice"
}
```

**Response (201 Created)**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Alice",
  "createdAt": "2025-11-04T12:00:00.000Z"
}
```

**Errors**
- `400 Bad Request` — Email already in use or invalid input.

---

### `POST /auth/login`
Authenticate user and issue a JWT.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK)**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Alice"
  }
}
```

**Errors**
- `401 Unauthorized` — Invalid email or password.

---

### `GET /auth/me`
Return current authenticated user details.

**Headers**
```
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Alice"
}
```

**Errors**
- `401 Unauthorized` — Missing or invalid token.

---

## USERS & PROFILES

### `GET /users/:id`
Return public information about a user.

**Response (200 OK)**
```json
{
  "id": 2,
  "name": "Bob",
  "profilePic": "/uploads/bob.jpg"
}
```

**Errors**
- `404 Not Found` — User does not exist.

---

### `GET /users/:id/profile`
Return user’s public profile.

**Response (200 OK)**
```json
{
  "id": 2,
  "about": "Film student who loves arthouse cinema.",
  "favoriteGenres": ["Drama", "Thriller"],
  "favoriteMovies": ["Fight Club", "Parasite", "Se7en"],
  "location": "Los Angeles",
  "profilePic": "/uploads/bob.jpg"
}
```

---

### `GET /users/:id/bio`
Return user’s biographical data used for recommendations.

**Response (200 OK)**
```json
{
  "id": 2,
  "moviePreferences": {
    "genres": ["Drama", "Thriller"],
    "decadePreference": "1990s",
    "languagePreference": "English",
    "favoriteDirector": "David Fincher",
    "lookingFor": "People who enjoy psychological thrillers"
  }
}
```

---

### `PUT /me/profile`
Update the logged-in user’s profile information.

**Request body**
```json
{
  "about": "Just updated my movie list!",
  "favoriteGenres": ["Sci-Fi", "Action"],
  "favoriteMovies": ["Interstellar", "Dune"]
}
```

**Response**
```json
{
  "message": "Profile updated successfully."
}
```

---

### `POST /me/profile-picture`
Upload or change profile picture (multipart form data).

**Response**
```json
{
  "profilePic": "/uploads/alice.jpg"
}
```

---

## RECOMMENDATIONS

### `GET /recommendations`
Return up to 10 best-matched users based on movie preferences and bio data.

**Response (200 OK)**
```json
{
  "recommendations": [
    { "id": 4, "matchScore": 0.92 },
    { "id": 7, "matchScore": 0.88 },
    { "id": 2, "matchScore": 0.85 }
  ]
}
```

Each `id` can then be fetched with:
- `/users/{id}` for name/profilePic  
- `/users/{id}/bio` for matching info  

**Errors**
- `400 Bad Request` — Profile incomplete.
- `404 Not Found` — No matches available.

---

## CONNECTIONS

### `GET /connections`
Return list of connected users (IDs only).

**Response (200 OK)**
```json
{
  "connections": [2, 4, 7]
}
```

---

### `POST /connections/request`
Send a connection request to another user.

**Request body**
```json
{ "targetUserId": 4 }
```

**Response**
```json
{ "message": "Connection request sent." }
```

---

### `GET /connections/requests`
Return list of pending incoming/outgoing requests.

**Response**
```json
{
  "incoming": [{ "id": 3, "name": "Emma" }],
  "outgoing": [{ "id": 4, "name": "Jake" }]
}
```

---

### `POST /connections/accept`
Accept a connection request.

**Request body**
```json
{ "fromUserId": 3 }
```

**Response**
```json
{ "message": "Connection accepted." }
```

---

### `DELETE /connections/:id`
Remove an existing connection.

**Response**
```json
{ "message": "Disconnected successfully." }
```

---

## CHAT

### `GET /chats`
Return all user chats, ordered by most recent message.

**Response**
```json
{
  "chats": [
    {
      "userId": 2,
      "lastMessage": "Let’s watch Inception tonight!",
      "timestamp": "2025-11-04T18:30:00Z",
      "unread": true
    }
  ]
}
```

---

### `GET /chats/:userId`
Return chat history between current user and another user (paginated).

**Response**
```json
{
  "messages": [
    {
      "from": 1,
      "to": 2,
      "text": "Hey, what’s your favorite Christopher Nolan film?",
      "timestamp": "2025-11-04T18:10:00Z"
    }
  ],
  "hasMore": false
}
```

---

### `POST /chats/:userId/send`
Send a message to a connected user.

**Request body**
```json
{ "text": "Let’s watch Interstellar this weekend!" }
```

**Response**
```json
{
  "message": "Sent successfully.",
  "timestamp": "2025-11-04T18:31:00Z"
}
```

---

## LOCATION (Future Feature)

### `PUT /me/location`
Store or update user’s location from browser GPS.

**Request body**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response**
```json
{ "message": "Location updated." }
```

---

## STATUS & HEALTHCHECK

### `GET /`
Simple test endpoint.

**Response**
```json
{ "status": "OK", "message": "Match-Me backend running 🎬" }
```

---

## Notes

- Passwords are always hashed with **bcrypt**.
- JWTs expire after 1 hour.
- File uploads handled with **Multer** or similar library.
- `/recommendations` should use at least **5 bio data points**.
- Email addresses are private; never returned in public endpoints.

---

### Next Steps

- Implement these routes in Express with Prisma.
- Add Swagger/OpenAPI documentation.
- Test each route with Postman before connecting to frontend.

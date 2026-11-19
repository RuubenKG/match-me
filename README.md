# GraphQL API Requirements and Testing Guide

This document provides instructions for testing the implemented GraphQL API according to the project requirements.

## 1. Developer Mode Enforcement
The GraphQL Playground (GraphiQL) is available in developer mode only.
- **How to Confirm**:
    1. Start the application using `docker compose up --build`. (The `-d` flag is pre-configured in `docker-compose.yml`).
    2. Access [http://localhost:9090/graphiql](http://localhost:9090/graphiql). The playground should load.
    3. Modify `docker-compose.yml` to remove the `command: ["-d"]` line.
    4. Access the same URL again. You should receive a "404 Not Found" or a "No static resource" error.

## 2. Simultaneous API Support
The GraphQL and REST APIs both work at the same time on port 9090.
- **How to Confirm**:
    1. While the application is running, access the GraphiQL playground at [http://localhost:9090/graphiql](http://localhost:9090/graphiql).
    2. In a separate terminal or browser tab, call a REST endpoint such as `GET http://localhost:9090/api/users/me`.
    3. Both should respond successfully.

## 3. Full REST Server Parity
The full REST server capability is available via the GraphQL API(excluding image uploading).
- **How to Confirm**:
    - Review the `schema.graphqls` file and the `GraphQLController.java`.
    - Observe that all core features have corresponding GraphQL endpoints:
        - **Auth**: `login`, `logout`, `registerUser` mutations.
        - **Social**: `sendMessage`, `requestConnection`, `acceptConnection` mutations.
        - **Search**: `searchMovies`, `searchActors`, `movieDetails` queries.

## 4. Required Types and Relationships
Required types (`User`, `Bio`, `Profile`) and their bidirectional relationships are available.
- **How to Confirm**:
    - Run the following query in GraphiQL with a valid Bearer token header:
      ```graphql
      {
        me {
          username
          bio { text user { username } }
          profile { firstName user { username } }
        }
      }
      ```
    - Verify that you can traverse from `User` to `Bio`/`Profile` and back to `User` in a single query.

## 5. Implemented Queries
Specific queries return the correct required types.
- **How to Confirm**:
    - Execute the following queries in GraphiQL and verify the return types match the schema:
        - `{ user(id: "1") { id username } }` -> Returns `User`
        - `{ myBio { id text } }` -> Returns `Bio`
        - `{ myProfile { id firstName } }` -> Returns `Profile`
        - `{ recommendations { id username } }` -> Returns `[User!]!`

## 6. Single-Query Recommendation Fetching
It is possible to get name, profile picture, about me (profile), and bio data for recommendations in one query.
- **How to Confirm**:
    - Run this exact query in GraphiQL:
      ```graphql
      {
        recommendations(limit: 5) {
          username
          profile {
            firstName
            lastName
            profilePictureUrl
          }
          bio {
            text
          }
        }
      }
      ```
    - Confirm that all nested fields are populated in the response.

## 7. Performance and Nested Types
The GraphQL API is performant and does not lag when querying nested types.
- **How to Confirm**:
    - Look at the execution time of nested queries in GraphiQL.

## 8. Real-time Functionality
Real-time functionality is implemented using GraphQL Subscriptions.
- **How to Confirm**:
    1. In one GraphiQL tab, run (With Bearer token of the recipient in the Headers):
       ```graphql
       subscription {
         newMessage {
           content
           senderId
         }
       }
       ```
    2. In another GraphiQL tab, execute a `sendMessage` mutation (With Bearer token of the sender in the Headers):
       ```graphql
       mutation {
         sendMessage(recipientId: "RECIPIENT ID HERE", content: "Test message") {
           id
           content
         }
       }
       ```
    3. Observe the message arriving instantly in the subscription tab.

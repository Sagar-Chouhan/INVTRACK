# INVTrack

Inventory and audit management frontend with role-based dashboards, API-driven workflows, and customer chat support integration.

## Table of Contents

- Overview
- Tech Stack
- Project Structure
- Core Features
- Role and Route Mapping
- Environment Variables
- Getting Started
- Scripts
- Chat Support Options
- Documentation Index
- Troubleshooting

## Overview

INVTrack is a React + Vite application for stock operations with three user roles:

- Admin: stock control, user management, reporting, audit assignment, verification overview
- User: stock requests, issued stock, request tracking, history
- Auditor: pending audits, verification workflows, audit history

The frontend integrates with two backend surfaces:

- Main inventory backend via REST APIs (default: http://localhost:4000/api)
- Realtime chat backend in this repository under chat-backend (default: http://localhost:5000)

Additionally, Tawk chat widget is enabled for production-style support handling.

## Tech Stack

Frontend:

- React 19
- Vite 7
- React Router 7
- Tailwind CSS 4
- Framer Motion
- Axios
- Socket.IO client

Chat backend:

- Node.js + Express
- Socket.IO
- MongoDB + Mongoose
- JWT authentication

## Project Structure

See full structure and module details in docs/PROJECT_STRUCTURE.md.

High-level layout:

- src/: frontend application
- chat-backend/: dedicated realtime chat server
- docs/: project documentation

## Core Features

- Role-based dashboard shell and navigation
- Auth context with protected/public routing
- Admin operations: inventory, users, pending requests, audit assignment, reports
- User operations: request stock, issue view, request history
- Auditor operations: pending verification workflows and history
- Tawk support chat with role-aware behavior
- Optional realtime chat module page at /support-chat for Socket.IO demo/testing

## Role and Route Mapping

See docs/ROUTES_AND_APIS.md for complete route and API mapping.

## Environment Variables

Frontend (root .env):

- VITE_API_BASE: main inventory API base URL
- Optional: VITE_CHAT_SERVER_URL for /support-chat page
- Optional: VITE_CHAT_ADMIN_ACCESS_KEY for admin mode in /support-chat

Chat backend (chat-backend/.env):

- PORT
- MONGODB_URI
- CLIENT_ORIGIN
- JWT_SECRET
- ADMIN_ACCESS_KEY

## Getting Started

### 1) Install frontend dependencies

npm install

### 2) Configure frontend env

Create .env in project root (already present in this workspace):

VITE_API_BASE=http://localhost:4000/api

Optional values:

VITE_CHAT_SERVER_URL=http://localhost:5000
VITE_CHAT_ADMIN_ACCESS_KEY=your-admin-access-key

### 3) Install chat backend dependencies

npm --prefix chat-backend install

### 4) Configure chat backend env

Copy chat-backend/.env.example to chat-backend/.env and update values.

### 5) Run frontend

npm run dev

### 6) Run chat backend (optional but required for /support-chat page)

npm run chat:backend

## Scripts

Frontend scripts:

- npm run dev: start Vite dev server
- npm run build: production build
- npm run preview: preview built app
- npm run chat:backend: start chat backend in dev mode
- npm run chat:backend:start: start chat backend in production mode

Chat backend scripts:

- npm --prefix chat-backend run dev
- npm --prefix chat-backend run start

## Chat Support Options

### Option A: Tawk widget (active in app shell)

- Script is loaded from index.html
- Identity sync and role-aware visibility are handled in src/components/chat/TawkIdentitySync.jsx
- Admin role hides widget; user/auditor can use support chat

### Option B: Realtime Socket.IO page

- Dedicated page: /support-chat
- Uses chat-backend for JWT auth, online presence, typing, and message history

## Documentation Index

- docs/PROJECT_STRUCTURE.md
- docs/ROUTES_AND_APIS.md
- docs/CHAT_SUPPORT.md

## Troubleshooting

### Frontend loads but data is missing

- Verify VITE_API_BASE points to a running inventory backend
- Check network errors for 401/403/500 responses

### Support chat not visible for user

- Confirm user role is not admin
- Confirm Tawk script is available in index.html
- Check browser console for Tawk_API availability

### Build issues

- Run npm install and npm --prefix chat-backend install again
- Clear node_modules and reinstall if lock mismatch occurs

### /support-chat errors

- Ensure chat-backend is running
- Ensure chat-backend/.env values are set
- Ensure MongoDB is reachable

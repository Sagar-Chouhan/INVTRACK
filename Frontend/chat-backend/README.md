# Realtime Support Chat Backend

## Setup

1. Install dependencies

npm install

2. Create env file

Copy `.env.example` to `.env` and update values.

Important variables:

- `JWT_SECRET`: used to sign and verify chat session tokens
- `ADMIN_ACCESS_KEY`: required for admin role login

3. Run server

npm run dev

The server runs at `http://localhost:5000` by default.

## Auth and Roles

- Login endpoint: `POST /api/chat/auth/login`
- For `role=user`: provide `name` and `role`
- For `role=admin`: provide `name`, `role`, and `adminAccessKey`
- Protected endpoints require header: `Authorization: Bearer <token>`

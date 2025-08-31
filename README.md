# Note-Taking Application

## Introduction

This is a modern, production-grade note-taking application built with a clean separation of concerns across client and server. It features secure email-based OTP signup, JWT (access + refresh) authentication, and a robust notes API backed by MongoDB. The frontend delivers a responsive, polished UX with protected routes, automatic token refresh, and helpful validation and error states.

## Key Features (Recruiter Overview)

- **Secure Auth Flow**: Email OTP verification for signup, email/password login, short-lived access tokens with refresh token rotation, and explicit logout with token revocation.
- **Notes Management**: Full CRUD with pagination, search (title/content), and tag filtering—scoped per authenticated user.
- **Robust API & Validation**: Joi-based request validation, consistent `APIResponse` shape, rate limiting (general/auth/OTP), Helmet, and CORS.
- **Email Delivery**: OTP emails via Nodemailer with a branded HTML template.
- **Frontend UX**: Protected routes, Axios interceptors for token injection and refresh, local storage persistence, and friendly form validations.
- **Clean Data Mapping**: Client normalizes server fields (`_id`, `userId`, `createdAt`, `updatedAt`) to client shape (`id`, `user_id`, `created_at`, `updated_at`) via `transformNote` in `client/src/services/api.ts`.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (access/refresh) + Email OTP verification
- **State Management**: React Context API

## Project Structure

```
note-taking-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   └── package.json
└── README.md
```

## Features

- **Email OTP Signup/Login**: Two-step signup with email OTP (`/api/auth/signup/email` → `/api/auth/verify-otp`) and email/password login
- **JWT Tokens with Refresh**: Access token + refresh token flow with automatic refresh in client interceptors
- **Password Reset via OTP**: Forgot and reset password flows using email OTP
- **Notes CRUD**: Create, read, update, delete notes per user with search, tags filter, and pagination
- **Validation & Security**: Joi validation, rate limiting, Helmet, CORS, hashed passwords, auth middleware
- **Responsive UI**: Protected dashboard and auth pages

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies
   - Client: `cd client && npm install`
   - Server: `cd server && npm install`
3. Set up environment variables (see below)
4. Start development servers
   - Server: `npm run dev` (in `server/`)
   - Client: `npm run dev` (in `client/`)

## Environment Variables

### Server (`server/.env`)
- PORT=5000
- DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
- CORS_ORIGIN=http://localhost:5173
- JWT_SECRET=your_access_token_secret
- JWT_REFRESH_SECRET=your_refresh_token_secret
- JWT_EXPIRES_IN=15m
- JWT_REFRESH_EXPIRES_IN=7d
- RATE_LIMIT_WINDOW_MS=900000
- RATE_LIMIT_MAX_REQUESTS=100
- EMAIL_HOST=smtp.gmail.com
- EMAIL_PORT=587
- EMAIL_USER=your_email@example.com
- EMAIL_PASSWORD=your_app_password

### Client
- Base URL is configured in `client/src/services/api.ts` as `http://localhost:5000/api`. Adjust if your server runs elsewhere.

## Running Scripts

### Server (`server/package.json`)
- dev: `nodemon src/index.ts`
- build: `tsc`
- start: `node dist/index.js`

### Client (`client/package.json`)
- dev: `vite`
- build: `tsc && vite build`
- preview: `vite preview`

## API

All responses follow a common shape defined by `APIResponse`:

```json
{
  "success": true,
  "message": "optional message",
  "data": { "...optional payload..." },
  "errors": [ { "field": "...", "message": "..." } ]
}
```

### Health
- GET `/health` → server status

### Auth Routes (`/api/auth`)
- POST `/signup/email` → initiate email signup, sends OTP
  - body: `{ email, password, firstName, lastName }`
- POST `/verify-otp` → verify OTP and create account
  - body: `{ email, otp, tempData }` (tempData returned by signup)
- POST `/login/email` → email/password login
  - body: `{ email, password }`
- POST `/refresh` → exchange refresh token for new tokens
  - body: `{ refreshToken }`
- POST `/logout` → revoke refresh token (optional body `{ refreshToken }`)
- POST `/forgot-password` → send password reset OTP
  - body: `{ email }`
- POST `/reset-password` → reset password with OTP
  - body: `{ email, otp, newPassword }`

### Notes Routes (`/api/notes`) — Protected (Authorization: Bearer <accessToken>)
- GET `/` → list notes
  - query: `page`, `limit`, `search`, `tags` (CSV)
- GET `/:id` → get note by id
- POST `/` → create note
  - body: `{ title, content, tags: string[] }`
- PUT `/:id` → update note
  - body: `{ title, content, tags: string[] }`
- DELETE `/:id` → delete note

Note: The client normalizes note fields in `client/src/services/api.ts` (`transformNote`) mapping server `_id/userId/createdAt/updatedAt` to client `id/user_id/created_at/updated_at`.

## Implementation Highlights

- `server/src/index.ts`: Express app with Helmet, CORS, rate limiting, health check, routes, global error handling
- `server/src/config/database.ts`: MongoDB connection with event logging
- `server/src/middleware/validation.ts`: Joi validation for auth and notes
- `server/src/middleware/auth.ts`: JWT access token verification and `AuthRequest` augmentation
- `server/src/middleware/rateLimiter.ts`: general, auth, OTP limiters
- `server/src/utils/jwt.ts`: token generation/verification
- `server/src/utils/email.ts`: Nodemailer transport + HTML OTP email
- `server/src/controllers/authController.ts`: signup (OTP), verify, login, refresh, logout, forgot/reset password
- `server/src/controllers/notesController.ts`: notes CRUD with search/tags/pagination
- `client/src/services/api.ts`: Axios instance, token storage/refresh, endpoints, note normalization
- `client/src/App.tsx`: routing with protected dashboard

## Development Timeline

- **Week 1**: Foundation Setup
- **Week 2**: Authentication Backend
- **Week 3**: Authentication Frontend
- **Week 4**: Notes Management Backend
- **Week 5**: Notes Management Frontend
- **Week 6**: UI Polish and Mobile Optimization
- **Week 7**: Testing and Deployment

## License

MIT License

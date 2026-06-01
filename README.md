# TradieTrack Lite

TradieTrack Lite is a small mobile-first job tracking app for tradespeople. It helps plumbers, cleaners, handymen, and other field workers keep job details, site notes, status, photos, reminders, time logs, and simple PDF reports in one place instead of scattered across messages, notes, and camera rolls.

The project is split into:

- `frontend/`: React Native app built with Expo.
- `backend/`: Express API backed by MongoDB through Mongoose.

## What The App Does

- Create jobs with a name, address, and notes.
- View a job list with status badges and summary counts.
- Edit job details, status, start time, end time, and reminder time.
- Mark jobs as `pending`, `in_progress`, or `completed`.
- Track logged time from start and end dates.
- Capture and attach job photos from the device camera.
- Schedule local reminder notifications through Expo Notifications.
- Generate a basic A4 PDF job report through the backend.
- Delete jobs with confirmation.

## Tech Stack

### Frontend

- React Native
- Expo
- React Navigation
- Axios
- Expo Image Picker
- Expo Notifications
- Jest and React Native Testing Library

### Backend

- Node.js
- Express
- MongoDB and Mongoose
- Puppeteer for PDF generation
- Jest, Supertest, Fast Check, and MongoDB Memory Server

## Project Structure

```text
.
├── backend/
│   ├── index.js              # Express app and API routes
│   ├── models/Job.js         # Mongoose job schema
│   ├── tests/api.test.js     # Backend API and property tests
│   └── .env.example
├── frontend/
│   ├── App.js                # Navigation shell
│   └── src/
│       ├── config.js         # API base URL
│       ├── screens/          # Jobs, CreateJob, JobDetail
│       ├── utils/time.js     # Time logging helpers
│       └── __tests__/        # Frontend tests
├── App_Readme.md             # Original build specification
└── README.md
```

## Requirements

- Node.js `v24.16.0` LTS
- npm `11.13.0`
- MongoDB running locally or a reachable MongoDB connection string
- Expo Go, an iOS simulator, or an Android emulator for the mobile app

Use the version pinned in `.nvmrc`:

```sh
nvm install
nvm use
node -v
npm -v
```

Node `v26` caused local dependency issues while verifying this repo, so use the pinned LTS version for development.

## Setup

### Backend

```sh
cd backend
cp .env.example .env
npm install
```

Set `MONGO_URI` in `backend/.env`.

Example:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/tradietrack-lite
AUTH_TOKEN_SECRET=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:19006,http://localhost:8081
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
REPORT_TIME_ZONE=Australia/Sydney
PDF_TMP_DIR=/tmp
```

Start the API:

```sh
npm run dev
```

If `nodemon` hits a local file watcher limit, run the server directly:

```sh
node index.js
```

The API listens on `http://localhost:4000`.

### Frontend

```sh
cd frontend
npm install
npm start
```

The default API URL is defined in `frontend/src/config.js`:

```js
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
```

For a physical device, set `EXPO_PUBLIC_API_URL` to a URL the device can reach, usually your machine's LAN IP:

```sh
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api npm start
```

## Verified Local Run

On this machine, the app was started with:

- Backend: `node index.js`
- Frontend: `expo start --localhost --port 8081`

Verified results:

- Backend connected to MongoDB and listened on port `4000`.
- `GET http://localhost:4000/api/jobs` returned stored job data.
- Expo Metro started and waited on `exp://127.0.0.1:8081`.

## API

Base URL: `/api`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/jobs` | List all jobs |
| `POST` | `/jobs` | Create a job |
| `PUT` | `/jobs/:id` | Update a job |
| `DELETE` | `/jobs/:id` | Delete a job |
| `POST` | `/jobs/:id/pdf` | Generate a PDF report |

### Job Payload

```json
{
  "name": "Fix kitchen tap",
  "customerName": "Sarah Williams",
  "customerPhone": "0400 123 456",
  "customerEmail": "sarah@example.com",
  "address": "12 Main St",
  "notes": "Leaking under sink",
  "status": "pending",
  "photos": [],
  "startDate": "2026-05-31T00:00:00.000Z",
  "endDate": null,
  "reminder": null
}
```

`name` and `address` are required. `status` must be `pending`, `in_progress`, or `completed`.

## Testing

Run backend tests:

```sh
cd backend
npm test
```

Run frontend tests:

```sh
cd frontend
npm test
```

## Notes And Current Limitations

- There is no authentication in the current version.
- Photos are stored as URI strings on the job document.
- PDF generation returns a temporary local file path from the backend.
- The frontend is mobile-first and intended to run through Expo.
- `App_Readme.md` contains the original LLM-ready build specification and product direction.

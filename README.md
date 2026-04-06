# TradieTrack Lite - Build Specification

## Overview
TradieTrack Lite is a simple mobile app for tradies (plumbers, handymen, cleaners) to track jobs, capture photos, set reminders, and export job reports as PDFs.

The goal is to build a minimal, fast, and practical tool that replaces WhatsApp, notes, and scattered photos.

## Core Principles
- Keep it extremely simple
- Mobile-first UX
- Fast input (under 10 seconds per job)
- Offline-friendly
- No authentication (initial version)
- Focus on real-world usage on job sites

---

## Setup

### Backend
cd backend
cp .env.example .env
npm install
npm run dev

### Frontend
cd frontend
npm install
npx expo start

Update API_URL in frontend/src/config.js

## Tech Stack

### Frontend
- React Native (Expo)
- Axios for API calls
- Expo Image Picker for photos
- Expo Notifications (for reminders)

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- Puppeteer (for PDF generation)

### Storage (Phase 2)
- AWS S3 or Supabase Storage (for images + PDFs)

---

## Core Features

### 1. Job Management
User can:
- Create a job
- View list of jobs
- Edit job
- Delete job

Each job includes:
- Customer name (string)
- Address (string)
- Notes (text)
- Status (enum)
- Photos (array of image URIs)
- Reminder datetime
- CreatedAt timestamp

---

### 2. Job Status
Status options:
- Pending
- In Progress
- Completed

Must be selectable via dropdown or buttons (not text input)

---

### 3. Photo Capture
- Use device camera
- Attach multiple photos to a job
- Show photo preview grid
- Store locally first (Phase 1)

---

### 4. Reminders
- User can set a date + time
- Trigger local notification
- Used for follow-ups or unfinished jobs

---

### 5. PDF Export (Paid Feature)
Generate a clean PDF report with:
- Job name
- Address
- Status
- Notes
- Photos
- Timestamp

PDF should:
- Be formatted cleanly (A4)
- Be shareable (download or email)

---

## API Design

### Base URL
`/api`

### Endpoints

#### Create Job
POST `/jobs`

# TradieTrack Lite - Build Specification (LLM Ready)

## Overview
TradieTrack Lite is a simple mobile app for tradies (plumbers, handymen, cleaners) to track jobs, capture photos, set reminders, and export job reports as PDFs.

The goal is to build a minimal, fast, and practical tool that replaces WhatsApp, notes, and scattered photos.

---

## Core Principles
- Keep it extremely simple
- Mobile-first UX
- Fast input (under 10 seconds per job)
- Offline-friendly
- No authentication (initial version)
- Focus on real-world usage on job sites

---

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
```

{
name,
address,
notes
}

```

#### Get Jobs
GET `/jobs`

#### Update Job
PUT `/jobs/:id`
```

{
name,
address,
notes,
status,
photos,
reminder
}

```

#### Delete Job
DELETE `/jobs/:id`

#### Generate PDF
POST `/jobs/:id/pdf`

Response:
```

{
url: "pdf_url"
}

````

---

## Database Schema (Mongoose)

```js
const JobSchema = new mongoose.Schema({
  name: String,
  address: String,
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  photos: [String],
  reminder: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
````

---

## Frontend Screens

### 1. Jobs List Screen

* List all jobs
* Show name + status
* Button to add new job

---

### 2. Create Job Screen

Inputs:

* Name
* Address
* Notes

CTA:

* Save job

---

### 3. Job Detail Screen

Sections:

* Edit name, address, notes
* Status selector
* Photo upload button
* Photo gallery
* Reminder picker
* Save button
* Generate PDF button

---

## UX Requirements

* Minimal taps to complete actions
* Large buttons (usable with dirty hands)
* Fast loading
* No complex navigation

---

## Monetization (Phase 2)

* Free:

  * Max 5 jobs
  * Limited photos

* Paid:

  * Unlimited jobs
  * PDF export
  * Unlimited photos

---

## Future Enhancements (Do NOT build now)

* Authentication
* Multi-user teams
* Invoicing
* Payments
* Analytics dashboards

---

## Success Criteria

* User can create a job in <10 seconds
* User can add photos easily on-site
* User can export a report in 1 tap
* App replaces WhatsApp + notes for job tracking

---

## Instructions for LLM

* Generate clean, modular code
* Avoid unnecessary complexity
* Prioritize working MVP over perfect architecture
* Ensure all core features are functional
* Use best practices but keep implementation minimal

---

## Output Expectation

LLM should generate:

* Full React Native app
* Express backend
* MongoDB models
* Working API routes
* PDF generation logic
* Basic UI (clean, usable, not fancy)

---

## Final Goal

A tradie should be able to:

1. Open app
2. Create job
3. Add photos
4. Mark job complete
5. Export report

All within a few minutes, without confusion.
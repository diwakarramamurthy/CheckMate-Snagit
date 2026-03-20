# CheckMate-Snagit — Product Document

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Target Users](#target-users)
4. [Core Features](#core-features)
5. [User Journeys](#user-journeys)
6. [Data Model](#data-model)
7. [API Reference](#api-reference)
8. [Tech Stack](#tech-stack)
9. [Report Formats](#report-formats)
10. [Known Limitations & Future Roadmap](#known-limitations--future-roadmap)

---

## Executive Summary

**CheckMate-Snagit** is a cross-platform mobile application that digitises the property inspection process from start to finish. Inspectors create a structured inspection for any property, work through an automatically generated checklist, attach photographic evidence, and export a professional PDF or Excel report — all from a single app.

The product eliminates paper-based snag lists, inconsistent reporting formats, and the manual effort of compiling findings after an inspection is complete.

---

## Problem Statement

Property inspections (move-in/move-out checks, rental handovers, new-build snagging) are typically managed with:

- Paper checklists that vary between inspectors
- Ad-hoc photo collections in phone camera rolls
- Manual report compilation in Word or Excel after the fact
- No structured audit trail or progress tracking

This leads to missed defects, disputes between landlords and tenants, and significant administrative overhead. **CheckMate-Snagit** replaces this process with a guided, consistent, and auditable digital workflow.

---

## Target Users

| User Type | Description |
|-----------|-------------|
| Property Inspectors | Professionals conducting move-in/move-out or snagging inspections |
| Landlords / Property Managers | Individuals managing rental properties who conduct their own checks |
| Real Estate Agents | Agents handing over new builds or completing pre-sale inspections |
| Facilities Managers | Corporate teams maintaining commercial or multi-unit residential buildings |

---

## Core Features

### 1. Inspection Management
- Create inspections with full property details (name, address, type, configuration)
- Track multiple inspections in a single list view with progress indicators
- Mark inspections as completed or delete them
- Assign an inspector name to each inspection

### 2. Dynamic Checklist Generation
- Checklist is generated server-side based on the property configuration entered at creation time
- Categories automatically included based on property spec:
  - Entry / Corridor
  - Living Room
  - N × Bedrooms
  - N × Bathrooms
  - Kitchen (if present)
  - N × Balconies
  - N × Parking Spots
  - Electrical System
  - Plumbing System
  - Overall Condition
- Each category contains 6–12 specific inspection points covering walls, ceilings, floors, doors, windows, fixtures, and utilities
- A typical apartment generates 100+ checklist items

### 3. Item-Level Assessment
Each checklist item supports:

| Field | Options / Format |
|-------|-----------------|
| Status | `pending` / `pass` / `fail` / `needs_attention` / `N/A` |
| Notes | Free-text notes |
| Photos | Multiple photos (camera or gallery pick) stored as base64 |
| Timestamp | Automatically recorded when an item is updated |

### 4. Progress Tracking
- Per-inspection progress bar on the home screen
- Real-time completion percentage within the inspection detail view
- Visual status colour-coding (green = pass, red = fail, amber = needs attention)

### 5. Report Export
- **PDF Report**: Professionally formatted document with property summary, statistics table, and categorised item list with colour-coded statuses
- **Excel Report**: Structured spreadsheet with a summary header, statistics, and a full item-by-item data table including photo count and timestamps
- Reports generated server-side and streamed directly to the device
- Sharing via email, WhatsApp, or other OS share sheet options

### 6. Photo Documentation
- Capture photos directly with the device camera
- Pick multiple photos from the device gallery
- Photos previewed inline on the item detail screen
- Photos embedded in generated PDF reports

---

## User Journeys

### Journey 1: Create a New Inspection

```
Home Screen
  → Tap "+" (floating action button)
  → New Inspection Form
      Enter: Property Name, Address, Type (apartment/house)
      Enter: Inspector Name (optional)
      Configure: No. of bedrooms, bathrooms, balconies, parking spots
      Toggle: Kitchen included
  → Tap "Create Inspection"
  → Redirected to Inspection Detail screen
      Dynamic checklist auto-generated and ready
```

### Journey 2: Complete an Inspection

```
Home Screen
  → Tap on an existing inspection
  → Inspection Detail Screen
      See categorised checklist with expandable sections
      Progress bar shows current completion %
  → Tap on a checklist item
  → Item Detail Screen
      Select status: pass / fail / needs_attention / N/A
      Add notes
      Take or pick photos
      Tap "Save"
  → Return to Inspection Detail
      Progress bar updates
  → Repeat for all items
```

### Journey 3: Generate & Share a Report

```
Inspection Detail Screen
  → Tap action menu (⋮)
  → Select "Export as PDF" or "Export as Excel"
  → Report generated on server, downloaded to device
  → OS share sheet opens
  → Share via email, WhatsApp, save to files, etc.
```

### Journey 4: Mark Inspection as Completed

```
Inspection Detail Screen
  → Tap action menu (⋮)
  → Select "Mark as Completed"
  → Inspection status updated to "completed"
  → Home screen shows completed badge
```

---

## Data Model

### Inspection

```
Inspection
├── id                  UUID string
├── property_id         UUID string
├── property_config     PropertyConfig (see below)
├── date                ISO timestamp (creation)
├── status              "pending" | "in_progress" | "completed"
├── inspector           string (optional)
├── completed_at        ISO timestamp (optional)
└── items               ChecklistItem[]
```

### PropertyConfig

```
PropertyConfig
├── name                string   — Property display name
├── address             string   — Full address
├── property_type       "apartment" | "house"
├── bedrooms            int      — Number of bedrooms
├── bathrooms           int      — Number of bathrooms
├── has_kitchen         bool     — Whether kitchen is included
├── balconies           int      — Number of balconies
└── parking_spots       int      — Number of parking spots
```

### ChecklistItem

```
ChecklistItem
├── id                  UUID string
├── category            string   — e.g. "Bedroom 1", "Electrical System"
├── name                string   — e.g. "Walls and paint condition"
├── status              "pending" | "pass" | "fail" | "needs_attention" | "N/A"
├── notes               string   (optional)
├── photos              string[] — Base64-encoded image strings
└── checked_at          ISO timestamp (optional)
```

---

## API Reference

Base URL: configured via `EXPO_PUBLIC_BACKEND_URL` environment variable.

All responses are JSON unless noted otherwise.

### Health Check

```
GET /api/
Response: { "message": "Property Inspection API is running" }
```

### Inspections

#### Create Inspection

```
POST /api/inspections
Content-Type: application/json

Body:
{
  "property_config": {
    "name": "Flat 12, Elm Court",
    "address": "12 Elm Street, London",
    "property_type": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "has_kitchen": true,
    "balconies": 1,
    "parking_spots": 0
  },
  "inspector": "Jane Smith"          // optional
}

Response 200: Inspection object (with auto-generated checklist items)
```

#### List All Inspections

```
GET /api/inspections
Response 200: Inspection[]
```

#### Get Single Inspection

```
GET /api/inspections/{id}
Response 200: Inspection object
Response 404: { "detail": "Inspection not found" }
```

#### Update Inspection

```
PUT /api/inspections/{id}
Content-Type: application/json

Body (all fields optional):
{
  "status": "completed",
  "inspector": "John Doe"
}

Response 200: Updated Inspection object
```

#### Delete Inspection

```
DELETE /api/inspections/{id}
Response 200: { "message": "Inspection deleted successfully" }
```

### Checklist Items

#### Update Checklist Item

```
PUT /api/inspections/{id}/items/{item_id}
Content-Type: application/json

Body (all fields optional):
{
  "status": "fail",
  "notes": "Large crack visible on east wall",
  "photos": ["data:image/jpeg;base64,..."]
}

Response 200: Updated ChecklistItem object
Response 404: { "detail": "Item not found" }
```

### Reports

#### Generate PDF Report

```
GET /api/inspections/{id}/pdf
Response: application/pdf (binary stream)
Content-Disposition: attachment; filename="inspection_{id}.pdf"
```

#### Generate Excel Report

```
GET /api/inspections/{id}/excel
Response: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (binary stream)
Content-Disposition: attachment; filename="inspection_{id}.xlsx"
```

---

## Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | Expo 54 / React Native |
| Language | TypeScript 5.9 |
| Navigation | Expo Router 6 (file-based) |
| State | React Hooks (useState / useEffect) |
| Forms | React Hook Form 7 |
| Icons | @expo/vector-icons |
| Images | expo-image-picker, expo-image |
| Export | expo-print, expo-sharing, expo-file-system |
| Platform | iOS, Android, Web |

### Backend

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI 0.110 |
| Language | Python 3 |
| Server | Uvicorn |
| Database | MongoDB (async via motor 3) |
| Validation | Pydantic 2 |
| PDF | ReportLab 4 |
| Excel | OpenPyXL 3 |
| Auth | None (open API — see Limitations) |

### Infrastructure

| Component | Detail |
|-----------|--------|
| Deployment | Emergent Agent / Docker |
| Database | MongoDB (remote) |
| Image | expo_mongo_base_image_cloud_arm |

---

## Report Formats

### PDF Report Contents

1. **Header**: App name, generation timestamp
2. **Property Details**: Name, address, type, configuration summary
3. **Inspection Info**: Date, inspector, status, completion %
4. **Statistics Table**: Total items, passed, failed, needs attention, pending, N/A
5. **Checklist by Category**: Each category as a section with colour-coded item rows
   - Green: Pass
   - Red: Fail
   - Amber: Needs Attention
   - Grey: N/A or Pending
6. **Photos**: Embedded inline where attached

### Excel Report Contents

1. **Row 1**: Report title
2. **Rows 2–10**: Property summary key-value pairs
3. **Rows 12–18**: Statistics table
4. **Row 20+**: Full item table with columns:
   - Category, Item Name, Status, Notes, Photos Count, Checked At

---

## Known Limitations & Future Roadmap

### Current Limitations

| Limitation | Detail |
|-----------|--------|
| No authentication | API is open — any client can read/write any inspection |
| Base64 photo storage | Storing photos as base64 in MongoDB is not scalable for high-volume use; photos should be moved to object storage (S3/GCS) |
| CORS fully open | Backend allows all origins — should be restricted in production |
| No offline support | App requires an active connection to the backend; no local caching |
| No multi-user | No concept of user accounts or inspection ownership |
| No notifications | No push notifications for completed inspections or report availability |

### Potential Future Features

- **User Accounts & Authentication** — JWT-based auth with role management (admin, inspector, viewer)
- **Cloud Photo Storage** — Move base64 photos to S3 or similar for scalability
- **Offline Mode** — Queue updates locally and sync when connectivity is restored
- **Inspection Templates** — Save and reuse custom checklist templates
- **Dashboard & Analytics** — Aggregate failure rates across properties and time periods
- **Digital Signatures** — Capture inspector and tenant/landlord signatures within the app
- **Scheduled Inspections** — Calendar integration and inspection reminders
- **Multi-language Support** — Localisation for non-English markets
- **AI Defect Detection** — Analyse photos automatically to flag potential defects
- **White-labelling** — Allow property management companies to brand the app

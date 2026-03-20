# CLAUDE.md — CheckMate-Snagit

This file is the primary reference for AI assistants (Claude and others) working on this codebase. Read it before making changes.

---

## Project Overview

**CheckMate-Snagit** is a property inspection management app.

- **Frontend**: Expo/React Native (TypeScript) — mobile + web
- **Backend**: FastAPI (Python) — REST API
- **Database**: MongoDB (async via motor)

For full product context see [`PRODUCT.md`](./PRODUCT.md).

---

## Repository Structure

```
CheckMate-Snagit/
├── frontend/                  # Expo React Native app
│   ├── app/                   # File-based routes (Expo Router)
│   │   ├── index.tsx          # Home screen — inspection list
│   │   ├── new-inspection.tsx # Create inspection form
│   │   ├── item-detail.tsx    # Checklist item editor
│   │   ├── inspection/
│   │   │   └── [id].tsx       # Inspection detail view
│   │   └── _layout.tsx        # Root navigation layout
│   ├── assets/                # Images, fonts
│   ├── app.json               # Expo app config (permissions, plugins)
│   ├── package.json           # Node dependencies
│   └── tsconfig.json          # TypeScript config
├── backend/
│   ├── server.py              # FastAPI app (all routes + logic)
│   └── requirements.txt       # Python dependencies
├── backend_test.py            # API integration test suite
├── tests/                     # pytest test directory
├── PRODUCT.md                 # Product specification document
└── CLAUDE.md                  # This file
```

---

## Development Setup

### Prerequisites

- Node.js + Yarn 1.22
- Python 3.10+
- MongoDB instance (local or remote)
- Expo CLI (`npm install -g expo-cli`) or use `npx expo`

### Frontend

```bash
cd frontend
yarn install

# Start dev server
npx expo start

# Platform-specific
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file (never commit this)
cat > .env << EOF
MONGO_URL=mongodb+srv://<user>:<password>@<host>/<db>?retryWrites=true&w=majority
DB_NAME=checkmate_inspections
EOF

# Start server
uvicorn backend.server:app --reload --host 0.0.0.0 --port 8000
```

### Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `MONGO_URL` | `backend/.env` | MongoDB connection string (async-compatible) |
| `DB_NAME` | `backend/.env` | MongoDB database name |
| `EXPO_PUBLIC_BACKEND_URL` | shell / `.env.local` | Backend base URL for the frontend |

---

## Key Commands

### Frontend

```bash
# Lint
npm run lint

# Type check (handled by TypeScript/Expo build)
npx tsc --noEmit

# Reset project to blank state
npm run reset-project
```

### Backend

```bash
# Run integration tests
python backend_test.py

# Run pytest suite
pytest tests/

# Lint
flake8 backend/

# Format
black backend/

# Type check
mypy backend/
```

---

## Architecture Decisions

### Backend

1. **Single-file API** — All routes, models, and business logic live in `backend/server.py`. Do not split unless the file exceeds ~1000 lines.

2. **Async throughout** — Use `async def` for all route handlers. The motor MongoDB driver is async; never use pymongo's synchronous client.

3. **Dynamic checklist generation** — When an inspection is created, the backend generates all checklist items based on `PropertyConfig`. This happens in `server.py` inside the `generate_checklist_items()` function. Categories are built programmatically from bedroom/bathroom/balcony/parking counts.

4. **Base64 photo storage** — Photos are stored as base64 strings inside the MongoDB document on the `ChecklistItem.photos` array. This is intentionally simple but will not scale beyond ~10 photos per inspection. Do not change this pattern without also updating the PDF report generator.

5. **In-memory report generation** — PDF and Excel files are built in memory using `io.BytesIO` and streamed via `StreamingResponse`. There is no temporary file created on disk.

6. **UUID IDs** — All IDs (`inspection.id`, `property.id`, `item.id`) are generated with `str(uuid.uuid4())`. Do not switch to MongoDB `ObjectId` without updating the entire ID handling chain.

7. **CORS is open** — `CORSMiddleware` allows all origins (`"*"`). This is intentional for development. Do not add auth logic without also tightening CORS.

### Frontend

1. **File-based routing** — Screen files in `frontend/app/` map directly to routes. Do not create screens outside `app/`. Navigation uses `expo-router`'s `router.push()` and `router.back()`.

2. **No global state** — There is no Redux/Zustand/Context store. All state is local via `useState`/`useEffect`. API calls are made directly in component effects or event handlers.

3. **API base URL** — Always use `process.env.EXPO_PUBLIC_BACKEND_URL` for the backend URL. Never hardcode a host.

4. **Passing data between screens** — Data is passed via query params using `router.push({ pathname, params })`. The receiving screen reads params via `useLocalSearchParams()`.

5. **New Architecture enabled** — `app.json` has `"newArchEnabled": true`. Do not use libraries that are incompatible with the New Architecture.

---

## Data Flow

```
User fills form
  → POST /api/inspections
  → Backend generates checklist items
  → Inspection stored in MongoDB
  → Response returned to frontend
  → Frontend navigates to inspection/[id]

User taps checklist item
  → Navigates to item-detail screen (passes inspection id + item id via params)
  → User selects status, adds notes, attaches photos
  → PUT /api/inspections/{id}/items/{item_id}
  → Backend updates item in MongoDB

User exports report
  → GET /api/inspections/{id}/pdf (or /excel)
  → Backend fetches inspection from MongoDB
  → Builds report in memory
  → Streams file to frontend
  → Frontend uses expo-sharing to open share sheet
```

---

## API Endpoints Quick Reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/` | Health check |
| POST | `/api/inspections` | Create inspection + checklist |
| GET | `/api/inspections` | List all inspections |
| GET | `/api/inspections/{id}` | Get single inspection |
| PUT | `/api/inspections/{id}` | Update inspection (status, inspector) |
| DELETE | `/api/inspections/{id}` | Delete inspection |
| PUT | `/api/inspections/{id}/items/{item_id}` | Update checklist item |
| GET | `/api/inspections/{id}/pdf` | Download PDF report |
| GET | `/api/inspections/{id}/excel` | Download Excel report |

Full request/response shapes are documented in [`PRODUCT.md`](./PRODUCT.md#api-reference).

---

## Testing

### Integration Tests (`backend_test.py`)

Run against a live backend instance. Tests cover:
- Health check
- Full inspection lifecycle (create → read → update → delete)
- Checklist item updates (status, notes, photos)
- PDF generation (checks content-type and non-empty response)
- Excel generation (same)
- 404 handling for invalid IDs

```bash
# Make sure BACKEND_URL is set or backend is running on localhost:8000
python backend_test.py
```

### Test Result Tracking (`test_result.md`)

The project uses a structured `test_result.md` file as a communication channel between the main agent and the testing agent. Format is defined at the top of that file — follow it when logging test results.

---

## Common Gotchas

| Gotcha | Detail |
|--------|--------|
| Motor vs pymongo | Always import from `motor.motor_asyncio`, never `pymongo` directly |
| `_id` vs `id` | MongoDB stores `_id`; all Pydantic models use `id`. The serialization helper `serialize_doc()` converts `_id` → `id` |
| Base64 size | Large photos will inflate MongoDB document size quickly. Warn users if they hit the 16MB document limit |
| Expo Router params | Query params from `useLocalSearchParams()` are always strings — parse integers explicitly |
| CORS in production | If deploying, set allowed origins to the production domain only |
| `MONGO_URL` format | Must use the async-compatible connection string format (standard `mongodb://` or `mongodb+srv://` both work with motor) |
| Report streaming | PDF/Excel routes use `StreamingResponse` — do not try to `return response.json()` from these endpoints |

---

## Git Workflow

- Branch naming: `claude/<short-description>-<session-id>`
- Always push to the branch specified in your task — never push to `main` directly
- Commit messages: imperative mood, concise, describe the *why* not just the *what*
- Example: `Add dynamic parking spot checklist generation`

```bash
git push -u origin claude/<branch-name>
```

---

## Dependencies to Know

### Frontend (key packages)

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `expo-image-picker` | Camera + gallery photo selection |
| `expo-print` | PDF rendering/printing on device |
| `expo-sharing` | OS share sheet |
| `expo-file-system` | Write/read files locally |
| `react-hook-form` | Form state management |
| `@expo/vector-icons` | Icon set (Ionicons used throughout) |

### Backend (key packages)

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `motor` | Async MongoDB driver |
| `pydantic` | Request/response validation |
| `reportlab` | PDF generation |
| `openpyxl` | Excel generation |
| `python-dotenv` | Load `.env` files |

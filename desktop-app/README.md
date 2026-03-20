# CheckMate-Snagit — Desktop App Folder

This folder contains everything you need to run CheckMate-Snagit from your desktop computer.

---

## Contents

| File | Purpose |
|------|---------|
| `start.sh` | Starts both backend and frontend with one command |
| `stop.sh` | Stops all running servers |
| `setup-env.sh` | Interactive helper to create `backend/.env` |
| `CheckMate-Snagit.desktop` | Linux desktop launcher (double-click shortcut) |

---

## Quick Start

### Step 1 — One-time setup

Run the environment setup helper to create your `backend/.env` file:

```bash
bash desktop-app/setup-env.sh
```

You will be prompted for your MongoDB connection string. See [`CLAUDE.md`](../CLAUDE.md) for details.

### Step 2 — Start the app

```bash
bash desktop-app/start.sh
```

This will:
1. Install any missing Python/Node dependencies automatically
2. Start the FastAPI backend on **http://localhost:8000**
3. Start the Expo web frontend on **http://localhost:8081**

Open **http://localhost:8081** in your browser to use the app.

### Step 3 — Stop the app

Press `Ctrl+C` in the terminal where `start.sh` is running, **or** run:

```bash
bash desktop-app/stop.sh
```

---

## Desktop Shortcut (Linux)

To add a clickable icon to your desktop:

1. Copy `CheckMate-Snagit.desktop` to your Desktop folder:
   ```bash
   cp desktop-app/CheckMate-Snagit.desktop ~/Desktop/
   chmod +x ~/Desktop/CheckMate-Snagit.desktop
   ```
2. Right-click the icon → **Allow Launching** (on GNOME/Ubuntu).
3. Double-click to launch.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm / npx | bundled with Node |

MongoDB is hosted externally (Atlas or self-hosted) — no local install needed.

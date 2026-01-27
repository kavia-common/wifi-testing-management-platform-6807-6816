# WiFi Testing Management Platform

This repo contains:

- `wifi_test_management_frontend/` — React frontend (dev server on **3000**)
- `backend/` — simple Node.js + Express mock API (server on **4000**, CORS enabled)

## Prerequisites

- Node.js 18+ recommended
- npm

## Run (one command)

From the repo root:

```bash
npm install
npm run dev
```

This starts:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

If you prefer to run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Frontend API base URL

The frontend uses the backend by default at:

- `http://localhost:4000`

You can override it by setting:

- `REACT_APP_API_BASE_URL`

(Existing env vars `REACT_APP_API_BASE` and `REACT_APP_BACKEND_URL` are also supported.)

## Verify backend with curl

Health check:

```bash
curl http://localhost:4000/health
```

Projects:

```bash
curl http://localhost:4000/projects
```

Test cases:

```bash
curl http://localhost:4000/test-cases
```

Test cases filtered by project:

```bash
curl "http://localhost:4000/test-cases?projectId=p2"
```

Executions:

```bash
curl http://localhost:4000/executions
```

Executions filtered by project:

```bash
curl "http://localhost:4000/executions?projectId=p3"
```

## Kavia Preview / Running

1. Run `npm run dev` from the repo root.
2. Open the **Preview** for the frontend (port **3000**).
3. The frontend will call the backend (port **4000**) via CORS-enabled API.

If you want to confirm the backend is reachable from the Preview environment, open a terminal and run the curl commands above.

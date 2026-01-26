# WiFi Test Management Frontend

A classic, professional React frontend for managing WiFi testing projects, test cases, execution runs, and results.

## What’s included

- App shell: header + left sidebar + main content + top-right toast notifications
- Routing:
  - `/projects` (default)
  - `/test-cases`
  - `/test-runs`
  - `/results`
- Reusable UI components:
  - Table (sorting, pagination, loading skeletons, empty states)
  - Modal
  - Form controls (Input/Select/TextArea/Checkbox)
  - Buttons (primary/secondary/danger)
  - Badges for statuses/priorities
  - Toast notifications
- API client abstraction with mock mode (no backend required to load UI)

## Environment variables

This app reads the following variables if present (Create React App requires the `REACT_APP_` prefix):

- `REACT_APP_API_BASE` (preferred)
- `REACT_APP_BACKEND_URL` (fallback if API_BASE is not set)
- `REACT_APP_FRONTEND_URL`
- `REACT_APP_WS_URL`
- `REACT_APP_NODE_ENV`
- `REACT_APP_NEXT_TELEMETRY_DISABLED`
- `REACT_APP_ENABLE_SOURCE_MAPS`
- `REACT_APP_PORT`
- `REACT_APP_TRUST_PROXY`
- `REACT_APP_LOG_LEVEL`
- `REACT_APP_HEALTHCHECK_PATH`
- `REACT_APP_FEATURE_FLAGS`
- `REACT_APP_EXPERIMENTS_ENABLED`

Only variables relevant to the frontend are used for behavior; others are read for visibility/future wiring.

## Mock API mode (recommended for local preview)

By default, the UI is designed to work without a backend by enabling mock API behavior.

Enable mock mode by setting:

```bash
REACT_APP_FEATURE_FLAGS=mockApi
```

The API client will then serve in-memory data with simulated latency. When mock mode is disabled, API methods intentionally throw a clear error until real backend endpoints/contracts are defined.

## Scripts

- `npm start`
- `npm test`
- `npm run build`

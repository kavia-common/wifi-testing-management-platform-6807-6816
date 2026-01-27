# API Client Layer (src/api)

This app uses a small API abstraction that supports:

- Fetch-based HTTP client with JSON + timeouts
- Standardized result objects (`{ ok: true, data }` or `{ ok: false, status, message }`)
- A simple in-memory mock adapter with the same method signatures
- Small helpers for loading/error state and toast notifications

## Base URL configuration

The API base URL is resolved from environment variables (no hard-coded URLs):

1. `REACT_APP_API_BASE` (preferred)
2. `REACT_APP_BACKEND_URL` (fallback)
3. `""` (empty string)

If no base URL is configured, the app automatically uses the **mock adapter** so the UI remains usable.

## Switching between Mock and Real API

### Use real backend (recommended for integration)

Set one of the following in your environment:

- `REACT_APP_API_BASE=https://your-backend.example.com`
  - or -
- `REACT_APP_BACKEND_URL=https://your-backend.example.com`

Restart the dev server after changing env vars.

### Force mock API (useful for demos / offline work)

In the browser console:

```js
window.__USE_MOCK_API__ = true;
window.location.reload();
```

To go back to real API:

```js
window.__USE_MOCK_API__ = false;
window.location.reload();
```

## Result object shape

All endpoints return standardized objects:

- Success: `{ ok: true, data, status? }`
- Error: `{ ok: false, status, message, details? }`

UI code should check `result.ok` before using `result.data`.

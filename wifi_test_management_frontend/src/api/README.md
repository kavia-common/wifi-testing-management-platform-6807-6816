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

### Force mock/real at runtime (developer toggle)

This app supports a lightweight runtime override:

1) **Query param** (persists automatically via localStorage):

- Force mock: `?api=mock`
- Force real: `?api=real` (will still fall back to mock if no base URL is configured)

2) **localStorage**:

- Key: `wifi_tm_api_mode` = `"mock"` or `"real"`

Legacy (still supported):

```js
window.__USE_MOCK_API__ = true; // mock
window.location.reload();
```

### Mode indicator

The header shows a small badge: **MOCK API** or **REAL API** (with base URL in tooltip).

## Result object shape

All endpoints return standardized objects:

- Success: `{ ok: true, data, status? }`
- Error: `{ ok: false, status, message, details? }`

UI code should check `result.ok` before using `result.data`.

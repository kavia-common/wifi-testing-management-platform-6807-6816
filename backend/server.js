'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

/**
 * Server configuration
 */
const PORT = Number.parseInt(process.env.PORT || '4000', 10);

/**
 * CORS configuration:
 * - For local dev, allow all origins so React dev server can call the API.
 * - If you need stricter CORS later, replace with an allowlist.
 */
app.use(cors());

/**
 * Body parsing (not strictly required for GET-only mock endpoints, but useful for future expansion).
 */
app.use(express.json());

/**
 * Mock data (in-memory)
 * Requirements:
 * - /projects: at least 3 items {id, name, owner, createdAt}
 * - /test-cases: at least 10 items {id, projectId, name, tags, status, updatedAt}
 * - /executions: at least 10 items {id, projectId, testCaseId, status, startedAt, durationMs}
 */
const projects = [
  { id: 'p1', name: 'WiFi Regression Suite', owner: 'alice', createdAt: '2025-12-01T09:00:00.000Z' },
  { id: 'p2', name: 'Router Compatibility Matrix', owner: 'bob', createdAt: '2025-12-10T10:30:00.000Z' },
  { id: 'p3', name: 'Enterprise Roaming Tests', owner: 'carol', createdAt: '2025-12-20T14:15:00.000Z' },
];

const testCases = [
  { id: 'tc1', projectId: 'p1', name: '2.4GHz throughput baseline', tags: ['2.4G', 'throughput'], status: 'active', updatedAt: '2026-01-05T09:10:00.000Z' },
  { id: 'tc2', projectId: 'p1', name: '5GHz throughput baseline', tags: ['5G', 'throughput'], status: 'active', updatedAt: '2026-01-05T09:12:00.000Z' },
  { id: 'tc3', projectId: 'p1', name: 'Packet loss under load', tags: ['reliability', 'load'], status: 'active', updatedAt: '2026-01-06T11:00:00.000Z' },
  { id: 'tc4', projectId: 'p2', name: 'WPA2 authentication (router set A)', tags: ['security', 'wpa2'], status: 'active', updatedAt: '2026-01-07T08:40:00.000Z' },
  { id: 'tc5', projectId: 'p2', name: 'WPA3 authentication (router set A)', tags: ['security', 'wpa3'], status: 'active', updatedAt: '2026-01-07T08:45:00.000Z' },
  { id: 'tc6', projectId: 'p2', name: 'Band steering behavior', tags: ['band-steering'], status: 'draft', updatedAt: '2026-01-10T16:05:00.000Z' },
  { id: 'tc7', projectId: 'p3', name: '802.11r fast roaming', tags: ['roaming', '11r'], status: 'active', updatedAt: '2026-01-12T13:20:00.000Z' },
  { id: 'tc8', projectId: 'p3', name: 'Enterprise EAP-TLS login', tags: ['enterprise', 'eap-tls'], status: 'active', updatedAt: '2026-01-12T13:22:00.000Z' },
  { id: 'tc9', projectId: 'p3', name: 'Roaming interruption time', tags: ['roaming', 'latency'], status: 'active', updatedAt: '2026-01-13T10:00:00.000Z' },
  { id: 'tc10', projectId: 'p2', name: 'DHCP renewal stability', tags: ['dhcp', 'stability'], status: 'active', updatedAt: '2026-01-14T09:30:00.000Z' },
];

const executions = [
  { id: 'e1', projectId: 'p1', testCaseId: 'tc1', status: 'passed', startedAt: '2026-01-20T02:00:00.000Z', durationMs: 184000 },
  { id: 'e2', projectId: 'p1', testCaseId: 'tc2', status: 'failed', startedAt: '2026-01-20T02:15:00.000Z', durationMs: 201000 },
  { id: 'e3', projectId: 'p1', testCaseId: 'tc3', status: 'running', startedAt: '2026-01-20T02:30:00.000Z', durationMs: 92000 },
  { id: 'e4', projectId: 'p2', testCaseId: 'tc4', status: 'passed', startedAt: '2026-01-21T03:00:00.000Z', durationMs: 99000 },
  { id: 'e5', projectId: 'p2', testCaseId: 'tc5', status: 'passed', startedAt: '2026-01-21T03:10:00.000Z', durationMs: 105000 },
  { id: 'e6', projectId: 'p2', testCaseId: 'tc10', status: 'failed', startedAt: '2026-01-21T03:25:00.000Z', durationMs: 88000 },
  { id: 'e7', projectId: 'p3', testCaseId: 'tc7', status: 'passed', startedAt: '2026-01-22T04:00:00.000Z', durationMs: 143000 },
  { id: 'e8', projectId: 'p3', testCaseId: 'tc8', status: 'passed', startedAt: '2026-01-22T04:20:00.000Z', durationMs: 132000 },
  { id: 'e9', projectId: 'p3', testCaseId: 'tc9', status: 'failed', startedAt: '2026-01-22T04:40:00.000Z', durationMs: 158000 },
  { id: 'e10', projectId: 'p2', testCaseId: 'tc6', status: 'queued', startedAt: '2026-01-22T05:00:00.000Z', durationMs: 0 },
];

/**
 * Helpers
 */
function normalizeId(val) {
  return (val ?? '').toString().trim();
}

/**
 * Routes
 */

// PUBLIC_INTERFACE
app.get('/health', (req, res) => {
  /** Health endpoint for readiness checks. Returns `{ ok: true }`. */
  res.json({ ok: true });
});

// PUBLIC_INTERFACE
app.get('/projects', (req, res) => {
  /** Returns a list of mock projects. */
  res.json(projects);
});

// PUBLIC_INTERFACE
app.get('/test-cases', (req, res) => {
  /**
   * Returns a list of mock test cases.
   * Supports query filter: /test-cases?projectId=<id>
   */
  const projectId = normalizeId(req.query.projectId);
  const data = projectId ? testCases.filter((t) => t.projectId === projectId) : testCases;
  res.json(data);
});

// PUBLIC_INTERFACE
app.get('/executions', (req, res) => {
  /**
   * Returns a list of mock executions.
   * NOTE: The prompt only required /executions to exist, but we also support `?projectId=<id>`
   * to align with the frontend's optional project filter.
   */
  const projectId = normalizeId(req.query.projectId);
  const data = projectId ? executions.filter((e) => e.projectId === projectId) : executions;
  res.json(data);
});

/**
 * Fallback 404 (keeps client errors clear)
 */
app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Not Found' });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${PORT}`);
});

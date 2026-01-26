/**
 * @typedef {"Active"|"Archived"} ProjectStatus
 * @typedef {"Low"|"Medium"|"High"} Priority
 * @typedef {"Queued"|"Running"|"Passed"|"Failed"} TestRunStatus
 * @typedef {"Passed"|"Failed"|"Blocked"} ResultStatus
 *
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} owner
 * @property {ProjectStatus} status
 * @property {string} updatedAt ISO string
 *
 * @typedef {Object} TestCase
 * @property {string} id
 * @property {string} title
 * @property {string} projectId
 * @property {string} projectName
 * @property {Priority} priority
 * @property {string} updatedAt ISO string
 *
 * @typedef {Object} TestRun
 * @property {string} id
 * @property {string} projectId
 * @property {string} projectName
 * @property {TestRunStatus} status
 * @property {string} startedAt ISO string
 * @property {number} durationSec
 *
 * @typedef {Object} Result
 * @property {string} id
 * @property {string} runId
 * @property {string} testCaseId
 * @property {string} testCaseTitle
 * @property {ResultStatus} status
 * @property {number} durationSec
 */
export {};

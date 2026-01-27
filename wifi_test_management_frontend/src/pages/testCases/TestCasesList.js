import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function TestCasesList() {
  /** Placeholder Test Cases list page (no API calls). */
  const sample = [
    { id: "tc-101", name: "Throughput (UDP) - 5GHz" },
    { id: "tc-102", name: "Roaming - Sticky Client" },
    { id: "tc-103", name: "Latency/Jitter - VoIP Profile" },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Test Cases</h1>
          <p className="muted">
            Placeholder list. CRUD + API integration will be added next.
          </p>
        </div>
        <button type="button" className="btn" disabled>
          New Test Case
        </button>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__title">Sample test cases</div>
          <div className="card__body">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {sample.map((tc) => (
                <li key={tc.id} style={{ margin: "6px 0" }}>
                  <Link to={`/test-cases/${tc.id}`}>{tc.name}</Link>{" "}
                  <span className="muted" style={{ fontSize: 12 }}>
                    ({tc.id})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function ResultsList() {
  /** Placeholder Results list page (no API calls). */
  const sample = [
    { id: "r-7001", verdict: "PASS", label: "Throughput - 5GHz" },
    { id: "r-7002", verdict: "FAIL", label: "Latency - VoIP profile" },
    { id: "r-7003", verdict: "PASS", label: "Roaming - sticky client" },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Results</h1>
          <p className="muted">
            Placeholder list. Filtering, exports, and detail views will be added
            next.
          </p>
        </div>
        <button type="button" className="btn" disabled>
          Export
        </button>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__title">Sample results</div>
          <div className="card__body">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {sample.map((r) => (
                <li key={r.id} style={{ margin: "6px 0" }}>
                  <Link to={`/results/${r.id}`}>{r.label}</Link>{" "}
                  <span className="muted" style={{ fontSize: 12 }}>
                    ({r.verdict})
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

import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function ExecutionsList() {
  /** Placeholder Executions list page (no API calls). */
  const sample = [
    { id: "ex-9001", status: "Completed", label: "Nightly regression" },
    { id: "ex-9002", status: "Running", label: "Roaming soak test" },
    { id: "ex-9003", status: "Queued", label: "IoT sweep" },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Executions</h1>
          <p className="muted">
            Placeholder list. Execution control will be added next.
          </p>
        </div>
        <button type="button" className="btn" disabled>
          New Execution
        </button>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__title">Sample executions</div>
          <div className="card__body">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {sample.map((ex) => (
                <li key={ex.id} style={{ margin: "6px 0" }}>
                  <Link to={`/executions/${ex.id}`}>{ex.label}</Link>{" "}
                  <span className="muted" style={{ fontSize: 12 }}>
                    ({ex.status})
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

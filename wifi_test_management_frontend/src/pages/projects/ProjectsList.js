import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function ProjectsList() {
  /** Placeholder Projects list page (no API calls). */
  const sample = [
    { id: "p-001", name: "Office AP Regression" },
    { id: "p-002", name: "Mesh Roaming Validation" },
    { id: "p-003", name: "IoT Compatibility Sweep" },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Projects</h1>
          <p className="muted">
            Placeholder list. CRUD + API integration will be added next.
          </p>
        </div>
        <button type="button" className="btn" disabled>
          New Project
        </button>
      </div>

      <div className="grid">
        <section className="card">
          <div className="card__title">Sample projects</div>
          <div className="card__body">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {sample.map((p) => (
                <li key={p.id} style={{ margin: "6px 0" }}>
                  <Link to={`/projects/${p.id}`}>{p.name}</Link>{" "}
                  <span className="muted" style={{ fontSize: 12 }}>
                    ({p.id})
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

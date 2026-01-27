import React from "react";
import { Link, useParams } from "react-router-dom";

// PUBLIC_INTERFACE
export default function ProjectDetail() {
  /** Placeholder Project detail page (no API calls). */
  const { projectId } = useParams();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Project Detail</h1>
          <p className="muted">
            Showing placeholder content for project{" "}
            <strong>{projectId}</strong>.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/projects">
          Back to Projects
        </Link>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__title">Overview</div>
          <div className="card__body">
            This page will later show project metadata, owners, and status.
          </div>
        </section>

        <section className="card">
          <div className="card__title">Linked items</div>
          <div className="card__body">
            Future: test cases and executions associated with this project.
          </div>
        </section>
      </div>
    </>
  );
}

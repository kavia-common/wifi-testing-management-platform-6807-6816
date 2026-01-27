import React from "react";
import { Link, useParams } from "react-router-dom";

// PUBLIC_INTERFACE
export default function ExecutionDetail() {
  /** Placeholder Execution detail page (no API calls). */
  const { executionId } = useParams();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Execution Detail</h1>
          <p className="muted">
            Showing placeholder content for execution{" "}
            <strong>{executionId}</strong>.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/executions">
          Back to Executions
        </Link>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__title">Run status</div>
          <div className="card__body">
            Future: live progress, logs, and start/stop controls.
          </div>
        </section>

        <section className="card">
          <div className="card__title">Artifacts</div>
          <div className="card__body">
            Future: attachments, captures, and result links.
          </div>
        </section>
      </div>
    </>
  );
}

import React from "react";
import { Link, useParams } from "react-router-dom";

// PUBLIC_INTERFACE
export default function TestCaseDetail() {
  /** Placeholder Test Case detail page (no API calls). */
  const { testCaseId } = useParams();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Test Case Detail</h1>
          <p className="muted">
            Showing placeholder content for test case{" "}
            <strong>{testCaseId}</strong>.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/test-cases">
          Back to Test Cases
        </Link>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__title">Definition</div>
          <div className="card__body">
            Future: parameters, steps, and required equipment profiles.
          </div>
        </section>

        <section className="card">
          <div className="card__title">Metrics</div>
          <div className="card__body">
            Future: expected thresholds and pass/fail criteria.
          </div>
        </section>
      </div>
    </>
  );
}

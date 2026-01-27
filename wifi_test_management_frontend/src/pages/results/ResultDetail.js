import React from "react";
import { Link, useParams } from "react-router-dom";

// PUBLIC_INTERFACE
export default function ResultDetail() {
  /** Placeholder Result detail page (no API calls). */
  const { resultId } = useParams();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Result Detail</h1>
          <p className="muted">
            Showing placeholder content for result <strong>{resultId}</strong>.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/results">
          Back to Results
        </Link>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__title">Verdict</div>
          <div className="card__body">
            Future: pass/fail, thresholds, and metrics breakdown.
          </div>
        </section>

        <section className="card">
          <div className="card__title">Charts & tables</div>
          <div className="card__body">
            Future: plots, distributions, and comparative runs.
          </div>
        </section>
      </div>
    </>
  );
}

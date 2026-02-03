import React from "react";

// PUBLIC_INTERFACE
export default function ResultsPage() {
  /** Results route placeholder. */
  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Results</h1>
            <p className="page__subtitle">
              Review pass/fail outcomes, logs, and artifacts for each execution.
            </p>
          </div>
        </div>

        <div className="emptyState">
          <div className="emptyState__title">No results available</div>
          <div className="emptyState__text">
            This is a placeholder screen. Filtering, result details, and
            downloads will be added next.
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";

// PUBLIC_INTERFACE
export default function ExecutionsPage() {
  /** Executions route placeholder. */
  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Executions</h1>
            <p className="page__subtitle">
              Track execution runs, schedules, and runtime status.
            </p>
          </div>
        </div>

        <div className="emptyState">
          <div className="emptyState__title">No executions found</div>
          <div className="emptyState__text">
            This is a placeholder screen. Execution creation and run tracking
            will be added next.
          </div>
        </div>
      </div>
    </div>
  );
}

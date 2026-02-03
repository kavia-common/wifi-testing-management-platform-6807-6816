import React from "react";

// PUBLIC_INTERFACE
export default function TestCasesPage() {
  /** Test cases route placeholder. */
  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Test Cases</h1>
            <p className="page__subtitle">
              Define test cases, parameters, and expected outcomes.
            </p>
          </div>
        </div>

        <div className="emptyState">
          <div className="emptyState__title">No test cases loaded</div>
          <div className="emptyState__text">
            This is a placeholder screen. Test case editor and tables will be
            added next.
          </div>
        </div>
      </div>
    </div>
  );
}

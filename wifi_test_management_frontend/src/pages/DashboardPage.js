import React from "react";

// PUBLIC_INTERFACE
export default function DashboardPage() {
  /** Dashboard route placeholder. */
  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Dashboard</h1>
            <p className="page__subtitle">
              Overview of projects, recent executions, and platform health.
            </p>
          </div>
        </div>

        <div className="grid2">
          <div className="statCard">
            <div className="statCard__label">Active Projects</div>
            <div className="statCard__value">—</div>
          </div>
          <div className="statCard">
            <div className="statCard__label">Executions Today</div>
            <div className="statCard__value">—</div>
          </div>
          <div className="statCard">
            <div className="statCard__label">Pass Rate</div>
            <div className="statCard__value">—</div>
          </div>
          <div className="statCard">
            <div className="statCard__label">Alerts</div>
            <div className="statCard__value">—</div>
          </div>
        </div>
      </div>
    </div>
  );
}

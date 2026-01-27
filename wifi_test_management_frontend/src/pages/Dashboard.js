import React from "react";

// PUBLIC_INTERFACE
export default function Dashboard() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="muted">
            This is a placeholder. Routing and CRUD modules will be added next.
          </p>
        </div>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__title">Projects</div>
          <div className="card__body">
            Track WiFi testing projects and their status.
          </div>
        </section>

        <section className="card">
          <div className="card__title">Recent Executions</div>
          <div className="card__body">
            View the latest test runs and outcomes.
          </div>
        </section>

        <section className="card">
          <div className="card__title">Quality Gates</div>
          <div className="card__body">
            Define pass/fail criteria for WiFi performance metrics.
          </div>
        </section>

        <section className="card">
          <div className="card__title">Alerts</div>
          <div className="card__body">
            Notifications will appear in the top-right when wired to the API.
          </div>
        </section>
      </div>
    </>
  );
}

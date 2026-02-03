import React from "react";

// PUBLIC_INTERFACE
export default function ProjectsPage() {
  /** Projects route placeholder. */
  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Projects</h1>
            <p className="page__subtitle">
              Create and manage WiFi testing projects.
            </p>
          </div>
        </div>

        <div className="emptyState">
          <div className="emptyState__title">No projects loaded</div>
          <div className="emptyState__text">
            This is a placeholder screen. Project list + create flow will be added
            next.
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Settings route placeholder. */
  return (
    <div className="page">
      <div className="pageCard">
        <div className="page__header">
          <div>
            <h1 className="page__title">Settings</h1>
            <p className="page__subtitle">
              Configure environment, integrations, and platform preferences.
            </p>
          </div>
        </div>

        <div className="emptyState">
          <div className="emptyState__title">Settings coming soon</div>
          <div className="emptyState__text">
            This is a placeholder screen. App configuration and user preferences
            will be added next.
          </div>
        </div>
      </div>
    </div>
  );
}

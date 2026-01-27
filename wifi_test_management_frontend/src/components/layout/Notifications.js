import React from "react";

function levelToClass(level) {
  switch (level) {
    case "success":
      return "notification--success";
    case "error":
      return "notification--error";
    case "warning":
      return "notification--warning";
    case "info":
    default:
      return "notification--info";
  }
}

// PUBLIC_INTERFACE
export default function Notifications({ items = [] }) {
  return (
    <section className="notifications" aria-label="Notifications">
      {items.slice(0, 3).map((n) => (
        <article
          key={n.id}
          className={`notification ${levelToClass(n.level)}`}
        >
          <div className="notification__title">{n.title}</div>
          <div className="notification__message">{n.message}</div>
        </article>
      ))}
    </section>
  );
}

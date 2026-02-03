import React from "react";
import "./EmptyState.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...rest
}) {
  /**
   * Empty state component for lists/tables with no data.
   *
   * Props:
   *  - title: string
   *  - description: string | ReactNode
   *  - icon: ReactNode
   *  - action: ReactNode (typically a <Button />)
   *
   * Example usage:
   *  // <EmptyState title="No projects" description="Create your first project." action={<Button>New Project</Button>} />
   */
  return (
    <section className={cx("uiEmptyState", className)} {...rest}>
      {icon ? <div className="uiEmptyState__icon" aria-hidden="true">{icon}</div> : null}
      <div className="uiEmptyState__title">{title}</div>
      {description ? <div className="uiEmptyState__text">{description}</div> : null}
      {action ? <div className="uiEmptyState__actions">{action}</div> : null}
    </section>
  );
}

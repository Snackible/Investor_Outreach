/** Shown the instant a link is clicked, while the next page loads, so clicks feel immediate. */
export default function Loading() {
  return (
    <div className="skeleton" role="status" aria-label="Loading">
      <div className="skeleton-title" />
      <div className="skeleton-panels">
        <div className="skeleton-panel" />
        <div className="skeleton-panel" />
      </div>
    </div>
  );
}

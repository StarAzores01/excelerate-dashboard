export default function EmptyState({ message = 'No records match the current filters.' }) {
  return (
    <div className="empty" role="status">
      <p className="empty__title">Nothing to show</p>
      <p className="empty__text">{message} Widen the filters or use Reset filters above.</p>
    </div>
  );
}

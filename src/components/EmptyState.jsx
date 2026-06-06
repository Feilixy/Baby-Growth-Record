export default function EmptyState({ icon, message, buttonText, onAction }) {
  return (
    <div className="empty-state fade-in">
      <div className="icon">{icon}</div>
      <p>{message}</p>
      {buttonText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {buttonText}
        </button>
      )}
    </div>
  );
}

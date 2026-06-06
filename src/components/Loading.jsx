export default function Loading({ text = '加载中...' }) {
  return (
    <div className="loading-screen fade-in">
      <div className="loading-spinner" />
      <span>{text}</span>
    </div>
  );
}

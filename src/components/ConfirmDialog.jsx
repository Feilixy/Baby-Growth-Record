import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmText = '确定', cancelText = '取消', danger = false, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: danger ? '#FFF0F0' : 'var(--pink-pale)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', color: danger ? '#E88' : 'var(--pink)',
        }}>
          <AlertTriangle size={24} />
        </div>
        {title && <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
        <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 20, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: 1 }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

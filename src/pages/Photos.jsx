import { useState, useEffect, useCallback } from 'react';
import { getPhotos, addPhoto, deletePhoto, getProfile } from '../utils/storage';
import { formatDate, todayStr } from '../utils/dateUtils';
import { usePin } from '../utils/PinContext';
import { Plus, Trash2 } from 'lucide-react';

export default function Photos() {
  const { isAllowed } = usePin();
  const canEdit = isAllowed('editor');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [birthDate, setBirthDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [form, setForm] = useState({ date: '', dataUrl: '', description: '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, p] = await Promise.all([
        getProfile(),
        getPhotos(),
      ]);
      setProfile(prof);
      if (prof?.birthDate) setBirthDate(prof.birthDate);
      setPhotos(p);
    } catch (e) {
      console.error('Photos 加载失败:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_W = 800;
        const scale = Math.min(1, MAX_W / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setForm(prev => ({ ...prev, dataUrl }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.date || !form.dataUrl) return;
    setSaving(true);
    try {
      await addPhoto(form);
      setShowForm(false);
      setForm({ date: '', dataUrl: '', description: '' });
      await refresh();
    } catch (e) {
      console.error('保存失败:', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这张照片吗？')) return;
    try {
      await deletePhoto(id);
      setSelectedPhoto(null);
      await refresh();
    } catch (e) {
      console.error('删除失败:', e);
    }
  };

  const openAdd = () => {
    setForm({ date: new Date().toISOString().split('T')[0], dataUrl: '', description: '' });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="loading-screen fade-in">
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><span className="emoji">📷</span> 照片墙</h1>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={16} /> 添加
          </button>
        )}
      </div>

      {photos.length === 0 && (
        <div className="empty-state">
          <div className="icon">📷</div>
          <p>还没有照片，快来记录宝宝的可爱瞬间吧 🍼</p>
          {canEdit && <button className="btn btn-primary" onClick={openAdd}>上传第一张照片</button>}
        </div>
      )}

      <div className="photo-grid">
        {photos.map(p => (
          <div key={p.id} className="photo-item" onClick={() => setSelectedPhoto(p)}>
            <img src={p.dataUrl} alt={p.description || '宝宝照片'} />
            {p.description && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.3)', color: 'white',
                padding: '4px 8px', fontSize: 12, textAlign: 'center'
              }}>
                {p.description}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo detail modal */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{formatDate(selectedPhoto.date)}</span>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedPhoto.id)}>
                <Trash2 size={14} /> 删除
              </button>
            </div>
            <img src={selectedPhoto.dataUrl} alt="宝宝照片" style={{ width: '100%', borderRadius: 12 }} />
            {selectedPhoto.description && (
              <p style={{ marginTop: 8, textAlign: 'center', color: 'var(--text)' }}>{selectedPhoto.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">添加照片 📷</div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={form.date} min={birthDate} max={todayStr()} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">照片</label>
              <input type="file" accept="image/*" onChange={handleFileChange}
                style={{ display: 'block', marginTop: 4 }} />
              {form.dataUrl && (
                <img src={form.dataUrl} alt="预览" style={{ width: '100%', borderRadius: 12, marginTop: 8 }} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">描述（可选）</label>
              <input className="form-input" type="text" placeholder="例如: 第一次微笑 😊" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存照片'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

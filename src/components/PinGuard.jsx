import { useState } from 'react';
import { usePin } from '../utils/PinContext';
import { checkPinExists, migrateFromLocalToFirestore } from '../utils/storage';
import { KeyRound, Shield, Baby } from 'lucide-react';

export default function PinGuard() {
  const { setPin, firebaseReady } = usePin();
  const [mode, setMode] = useState('enter'); // 'enter' | 'create'
  const [pin, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    // 验证 PIN 格式
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setError('请输入 4-6 位数字');
      return;
    }

    if (mode === 'create' && pin !== confirmPin) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'enter') {
        // 检查 PIN 是否存在数据
        const exists = await checkPinExists(pin);
        if (!exists && firebaseReady) {
          // 如果 Firebase 已配置但 PIN 不存在
          setError('该家庭码不存在，请检查或选择「创建新家庭码」');
          setLoading(false);
          return;
        }
        // 如果 Firebase 未配置，直接放行（纯本地模式）
      }

      // 迁移本地数据到 Firestore（新 PIN 且本地有旧数据时自动迁移）
      await migrateFromLocalToFirestore();

      await setPin(pin);
    } catch (e) {
      setError('操作失败，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="pin-guard">
      <div className="pin-logo">
        <Baby size={48} strokeWidth={1.5} />
      </div>
      <h1 className="pin-title">宝宝成长记录</h1>
      <p className="pin-subtitle">记录宝宝成长的每一个美好瞬间</p>

      {!firebaseReady && (
        <div className="pin-warning">
          <Shield size={16} />
          <span>离线模式，数据仅保存在本机</span>
        </div>
      )}

      <div className="pin-tabs">
        <button
          className={`pin-tab ${mode === 'enter' ? 'active' : ''}`}
          onClick={() => { setMode('enter'); setError(''); }}
        >
          <KeyRound size={16} />
          已有家庭码
        </button>
        <button
          className={`pin-tab ${mode === 'create' ? 'active' : ''}`}
          onClick={() => { setMode('create'); setError(''); }}
        >
          <Shield size={16} />
          创建新家庭码
        </button>
      </div>

      <div className="pin-input-group">
        <label className="pin-label">
          {mode === 'create' ? '设置 4-6 位数字家庭码' : '输入家庭码'}
        </label>
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="请输入数字"
          value={pin}
          onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />

        {mode === 'create' && (
          <>
            <label className="pin-label" style={{ marginTop: 12 }}>
              再次确认家庭码
            </label>
            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="再次输入"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </>
        )}

        {error && <div className="pin-error">{error}</div>}

        <button
          className="pin-submit"
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
        >
          {loading ? '处理中...' : mode === 'create' ? '创建并进入' : '进入'}
        </button>
      </div>

      <p className="pin-hint">
        {mode === 'create'
          ? '创建后请在家人手机上也输入同一个家庭码，所有设备共享数据 ✨'
          : '使用家人共享的家庭码登录，所有设备数据同步'}
      </p>
    </div>
  );
}

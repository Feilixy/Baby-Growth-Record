import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initFirebase } from './firebase';
import { setActivePin, getActivePin, clearPin } from './storage';

const PinContext = createContext(null);

export function PinProvider({ children }) {
  const [pinCode, setPin] = useState(getActivePin);
  const [firebaseReady, setFirebaseReady] = useState(null); // null=加载中 true/false

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const ok = await initFirebase();
      if (!cancelled) setFirebaseReady(ok);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const handleSetPin = useCallback(async (pin) => {
    setActivePin(pin);
    setPin(pin);
  }, []);

  const handleClearPin = useCallback(() => {
    clearPin();
    setPin(null);
  }, []);

  return (
    <PinContext.Provider value={{
      pinCode,
      isAuthenticated: !!pinCode,
      firebaseReady,
      setPin: handleSetPin,
      clearPin: handleClearPin,
    }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error('usePin 必须在 PinProvider 内使用');
  return ctx;
}

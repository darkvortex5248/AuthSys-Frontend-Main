import { useState, useCallback } from 'react';

function getHWID() {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen ? screen.width + 'x' + screen.height + 'x' + screen.colorDepth : '',
      new Date().getTimezoneOffset(),
    ];
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  } catch {
    return 'unknown';
  }
}

export function useDevice(appSecret, baseUrl = 'https://authsys-main-production.up.railway.app/device') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  const server = baseUrl.replace(/\/+$/, '');

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${server}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_secret: appSecret, hwid: getHWID() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      setLastResponse(data);
      if (data.active === true) return true;
      setError(data.message || 'Device deactivated by admin');
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [appSecret, server]);

  const register = useCallback(async (deviceName) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { group_secret: appSecret, hwid: getHWID() };
      if (deviceName) payload.device_name = deviceName;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${server}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      setLastResponse(data);
      return data.active === true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [appSecret, server]);

  return { check, register, loading, error, lastResponse };
}

export function DeviceStatus({ appSecret, baseUrl }) {
  const { check, register, loading, error, lastResponse } = useDevice(appSecret, baseUrl);
  const [status, setStatus] = useState(null);

  const handleCheck = async () => {
    const active = await check();
    setStatus(active ? 'active' : 'blocked');
  };

  return (
    <div>
      <button onClick={handleCheck} disabled={loading}>
        {loading ? 'Checking...' : 'Check Device'}
      </button>
      {status && (
        <p style={{ color: status === 'active' ? 'green' : 'red' }}>
          Device {status}
        </p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

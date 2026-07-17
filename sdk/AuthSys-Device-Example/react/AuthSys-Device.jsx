import { useState, useCallback } from 'react';

function getHWID() {
  try {
    const crypto = require('crypto');
    const os = require('os');
    const serial = os.hostname() + '-' + os.platform() + '-' + os.arch();
    return crypto.createHash('md5').update(serial).digest('hex').toUpperCase();
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
      const res = await fetch(`${server}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_secret: appSecret, hwid: getHWID() }),
      });
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
      const payload = { app_secret: appSecret, hwid: getHWID() };
      if (deviceName) payload.device_name = deviceName;
      const res = await fetch(`${server}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
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

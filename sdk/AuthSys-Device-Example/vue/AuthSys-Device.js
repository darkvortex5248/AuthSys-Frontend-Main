import { ref } from 'vue';

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
  const loading = ref(false);
  const error = ref(null);
  const lastResponse = ref(null);
  const server = baseUrl.replace(/\/+$/, '');

  async function check() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${server}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_secret: appSecret, hwid: getHWID() }),
      });
      const data = await res.json();
      lastResponse.value = data;
      if (data.active === true) return true;
      error.value = data.message || 'Device deactivated by admin';
      return false;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(deviceName) {
    loading.value = true;
    error.value = null;
    try {
      const payload = { app_secret: appSecret, hwid: getHWID() };
      if (deviceName) payload.device_name = deviceName;
      const res = await fetch(`${server}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      lastResponse.value = data;
      return data.active === true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { check, register, loading, error, lastResponse };
}

import { ref } from 'vue';

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
  const loading = ref(false);
  const error = ref(null);
  const lastResponse = ref(null);
  const server = baseUrl.replace(/\/+$/, '');

  async function check() {
    loading.value = true;
    error.value = null;
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

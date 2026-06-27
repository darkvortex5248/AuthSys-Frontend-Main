import { ref, readonly } from 'vue';

function getHwid(): string {
  if (typeof document === 'undefined') return 'server-env';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'browser-fingerprint';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('AuthSys-Secure-Fingerprint', 2, 15);
    const b64 = canvas.toDataURL().replace('data:image/png;base64,', '');
    const bin = atob(b64);
    return `web-${bin.length}-${b64.substring(0, 16)}`;
  } catch {
    return 'browser-fingerprint';
  }
}

export function useAuthSys(secret: string, apiUrl = "https://authsys-main-production.up.railway.app/api/v1") {
  const baseUrl = apiUrl.replace(/\/+$/, '');
  const initialized = ref(false);
  const sessionToken = ref<string | null>(null);
  const userData = ref<any | null>(null);
  const lastError = ref<string>('');

  const hwid = getHwid();

  async function _post(endpoint: string, body?: any, headers?: Record<string, string>) {
    try {
      const res = await fetch(`${baseUrl}/client/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      lastError.value = data.detail || '';
      return data;
    } catch (e: any) {
      lastError.value = e.message;
      return { success: false, detail: e.message };
    }
  }

  async function init() {
    lastError.value = '';
    const data = await _post('init', { app_secret: secret, version: '1.0.0', hwid });
    if (data.status === 'success' || data.status === 'update_available') {
      initialized.value = true;
    } else {
      lastError.value = data.detail || data.message || 'Init failed';
    }
    return data;
  }

  async function login(username: string, password: string, sessionLength = 86400) {
    lastError.value = '';
    sessionToken.value = null;
    if (!initialized.value) { lastError.value = 'init() failed or not called'; return { success: false, detail: lastError.value }; }

    const data = await _post('login', { app_secret: secret, username, password, hwid, session_length: sessionLength });
    if (data.detail) {
      lastError.value = data.detail;
    } else if (data.success && data.token) {
      sessionToken.value = data.token;
      userData.value = data.user || { username: data.username };
    } else if (!data.success) {
      lastError.value = 'Login failed: server returned success=false';
    }
    return data;
  }

  async function register(username: string, password: string, licenseKey: string, email?: string) {
    lastError.value = '';
    if (!initialized.value) { lastError.value = 'init() failed or not called'; return { success: false, detail: lastError.value }; }

    const body: any = { app_secret: secret, username, password, license_key: licenseKey, hwid };
    if (email) body.email = email;

    const data = await _post('register', body);
    if (data.detail) lastError.value = data.detail;
    else if (!data.success) lastError.value = 'Registration failed';
    return data;
  }

  async function licenseLogin(key: string, sessionLength = 86400) {
    lastError.value = '';
    sessionToken.value = null;
    if (!initialized.value) { lastError.value = 'init() failed or not called'; return { success: false, detail: lastError.value }; }

    const data = await _post('license-login', { app_secret: secret, license_key: key, hwid, session_length: sessionLength });
    if (data.detail) {
      lastError.value = data.detail;
    } else if (data.success && data.token) {
      sessionToken.value = data.token;
      userData.value = data.user || { username: data.username };
    } else if (!data.success) {
      lastError.value = 'License login failed: server returned success=false';
    }
    return data;
  }

  async function licenseCheck(key: string) {
    lastError.value = '';
    const data = await _post('license/check', { app_secret: secret, license_key: key });
    if (data.detail) lastError.value = data.detail;
    return data;
  }

  async function verify() {
    lastError.value = '';
    if (!sessionToken.value) { lastError.value = 'No active session. Login first.'; return { success: false, detail: lastError.value }; }

    const data = await _post('verify', null, { 'Authorization': `Bearer ${sessionToken.value}`, 'X-HWID': hwid });
    if (data.detail) lastError.value = data.detail;
    else if (!data.valid) lastError.value = 'Session verification failed';
    return data;
  }

  async function chatSend(roomId: number, message: string) {
    lastError.value = '';
    if (!sessionToken.value) { lastError.value = 'No active session. Login first.'; return { success: false, detail: lastError.value }; }

    const data = await _post(`chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`, null, {
      'Authorization': `Bearer ${sessionToken.value}`
    });
    if (data.detail) lastError.value = data.detail;
    return data;
  }

  function logout() {
    sessionToken.value = null;
    userData.value = null;
  }

  return {
    initialized: readonly(initialized),
    sessionToken: readonly(sessionToken),
    userData: readonly(userData),
    lastError: readonly(lastError),
    init,
    login,
    register,
    licenseLogin,
    licenseCheck,
    verify,
    chatSend,
    logout
  };
}

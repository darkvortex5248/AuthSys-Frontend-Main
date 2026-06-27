import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AuthContextType {
  initialized: boolean;
  sessionToken: string | null;
  userData: any | null;
  lastError: string;
  init: () => Promise<any>;
  login: (u: string, p: string, sessionLength?: number) => Promise<any>;
  register: (u: string, p: string, licenseKey: string, email?: string) => Promise<any>;
  licenseLogin: (key: string, sessionLength?: number) => Promise<any>;
  licenseCheck: (key: string) => Promise<any>;
  verify: () => Promise<any>;
  chatSend: (roomId: number, message: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

export const AuthProvider = ({ secret, apiUrl = "https://authsys-main-production.up.railway.app/api/v1", children }: {
  secret: string;
  apiUrl?: string;
  children: ReactNode;
}) => {
  const baseUrl = apiUrl.replace(/\/+$/, '');
  const [initialized, setInitialized] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [lastError, setLastError] = useState('');

  const hwid = getHwid();

  const _post = useCallback(async (endpoint: string, body?: any, headers?: Record<string, string>) => {
    try {
      const res = await fetch(`${baseUrl}/client/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setLastError(data.detail || '');
      return data;
    } catch (e: any) {
      setLastError(e.message);
      return { success: false, detail: e.message };
    }
  }, [baseUrl]);

  const init = useCallback(async () => {
    setLastError('');
    const data = await _post('init', { app_secret: secret, version: '1.0.0', hwid });
    if (data.status === 'success' || data.status === 'update_available') {
      setInitialized(true);
    } else {
      setLastError(data.detail || data.message || 'Init failed');
    }
    return data;
  }, [_post, secret, hwid]);

  const login = useCallback(async (username: string, password: string, sessionLength = 86400) => {
    setLastError('');
    setSessionToken(null);
    if (!initialized) { setLastError('init() failed or not called'); return { success: false, detail: lastError }; }

    const data = await _post('login', { app_secret: secret, username, password, hwid, session_length: sessionLength });
    if (data.detail) {
      setLastError(data.detail);
    } else if (data.success && data.token) {
      setSessionToken(data.token);
      setUserData(data.user || { username: data.username });
    } else if (!data.success) {
      setLastError('Login failed: server returned success=false');
    }
    return data;
  }, [_post, initialized, secret, hwid]);

  const register = useCallback(async (username: string, password: string, licenseKey: string, email?: string) => {
    setLastError('');
    if (!initialized) { setLastError('init() failed or not called'); return { success: false, detail: lastError }; }

    const body: any = { app_secret: secret, username, password, license_key: licenseKey, hwid };
    if (email) body.email = email;

    const data = await _post('register', body);
    if (data.detail) setLastError(data.detail);
    else if (!data.success) setLastError('Registration failed');
    return data;
  }, [_post, initialized, secret, hwid]);

  const licenseLogin = useCallback(async (key: string, sessionLength = 86400) => {
    setLastError('');
    setSessionToken(null);
    if (!initialized) { setLastError('init() failed or not called'); return { success: false, detail: lastError }; }

    const data = await _post('license-login', { app_secret: secret, license_key: key, hwid, session_length: sessionLength });
    if (data.detail) {
      setLastError(data.detail);
    } else if (data.success && data.token) {
      setSessionToken(data.token);
      setUserData(data.user || { username: data.username });
    } else if (!data.success) {
      setLastError('License login failed: server returned success=false');
    }
    return data;
  }, [_post, initialized, secret, hwid]);

  const licenseCheck = useCallback(async (key: string) => {
    setLastError('');
    const data = await _post('license/check', { app_secret: secret, license_key: key });
    if (data.detail) setLastError(data.detail);
    return data;
  }, [_post, secret]);

  const verify = useCallback(async () => {
    setLastError('');
    if (!sessionToken) { setLastError('No active session. Login first.'); return { success: false, detail: lastError }; }

    const data = await _post('verify', null, { 'Authorization': `Bearer ${sessionToken}`, 'X-HWID': hwid });
    if (data.detail) setLastError(data.detail);
    else if (!data.valid) setLastError('Session verification failed');
    return data;
  }, [_post, sessionToken, hwid]);

  const chatSend = useCallback(async (roomId: number, message: string) => {
    setLastError('');
    if (!sessionToken) { setLastError('No active session. Login first.'); return { success: false, detail: lastError }; }

    const data = await _post(`chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`, null, {
      'Authorization': `Bearer ${sessionToken}`
    });
    if (data.detail) setLastError(data.detail);
    return data;
  }, [_post, sessionToken]);

  const logout = useCallback(() => {
    setSessionToken(null);
    setUserData(null);
  }, []);

  return (
    <AuthContext.Provider value={{ initialized, sessionToken, userData, lastError, init, login, register, licenseLogin, licenseCheck, verify, chatSend, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthSys = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthSys must be used within an AuthProvider');
  return context;
};

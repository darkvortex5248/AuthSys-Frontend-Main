import { ref, reactive } from 'vue';

export interface AuthSysOptions {
  appSecret: string;
  appName?: string;
  version?: string;
  apiUrl?: string;
  timeout?: number;
  maxRetries?: number;
  skipCertificateValidation?: boolean;
  enableLogging?: boolean;
}

export function useAuthSys(options: AuthSysOptions) {
  const state = reactive({
    initialized: false,
    authenticated: false,
    username: '',
    variables: {} as Record<string, any>,
    sessionToken: '',
  });

  const apiUrl = (options.apiUrl || 'https://api.authsys.dpdns.org/api/v1').replace(/\/$/, '');

  const sendRequest = async (endpoint: string, data?: any, headers?: Record<string, string>) => {
    const url = `${apiUrl}/client/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = result?.detail || response.statusText;
      throw new Error(`[${detail}]`);
    }

    return result;
  };

  const init = async () => {
    const result = await sendRequest('init', {
      app_secret: options.appSecret,
      version: options.version || '',
      app_name: options.appName || '',
      hwid: getHwid(),
    });
    state.initialized = true;
    if (result.variables) state.variables = result.variables;
    return result;
  };

  const register = async (username: string, password: string, licenseKey: string, email?: string) => {
    return sendRequest('register', {
      app_secret: options.appSecret,
      username,
      password,
      license_key: licenseKey,
      hwid: getHwid(),
      ...(email && { email }),
    });
  };

  const login = async (username: string, password: string, sessionLength = 86400) => {
    const result = await sendRequest('login', {
      app_secret: options.appSecret,
      username,
      password,
      hwid: getHwid(),
      session_length: sessionLength,
    });
    if (result.token) {
      state.sessionToken = result.token;
      state.authenticated = true;
    }
    if (result.username) state.username = result.username;
    return result;
  };

  const licenseLogin = async (licenseKey: string, sessionLength = 86400) => {
    const result = await sendRequest('license-login', {
      app_secret: options.appSecret,
      license_key: licenseKey,
      hwid: getHwid(),
      session_length: sessionLength,
    });
    if (result.token) {
      state.sessionToken = result.token;
      state.authenticated = true;
    }
    return result;
  };

  const licenseCheck = async (licenseKey: string) => {
    return sendRequest('license/check', {
      app_secret: options.appSecret,
      license_key: licenseKey,
    });
  };

  const verify = async () => {
    return sendRequest('verify', null, {
      Authorization: `Bearer ${state.sessionToken}`,
      'X-HWID': getHwid(),
    });
  };

  const sendChatMessage = async (roomId: number, message: string) => {
    return sendRequest(`chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`, null, {
      Authorization: `Bearer ${state.sessionToken}`,
    });
  };

  const registerDevice = async (hwid: string, deviceName?: string) => {
    return sendRequest('device/register', {
      app_secret: options.appSecret,
      hwid,
      ...(deviceName && { device_name: deviceName }),
    });
  };

  const checkDevice = async (hwid: string) => {
    return sendRequest('device/check', {
      app_secret: options.appSecret,
      hwid,
    });
  };

  const getVariable = (key: string) => {
    return state.variables[key];
  };

  const logout = () => {
    state.sessionToken = '';
    state.authenticated = false;
    state.username = '';
  };

  return {
    state,
    init,
    register,
    login,
    licenseLogin,
    licenseCheck,
    verify,
    sendChatMessage,
    registerDevice,
    checkDevice,
    getVariable,
    logout,
  };
}

function getHwid(): string {
  return 'web_hwid';
}

import React, { createContext, useContext, useState, useCallback } from 'react';

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

export interface AuthSysContextType {
  initialized: boolean;
  authenticated: boolean;
  username: string;
  variables: Record<string, any>;
  init: () => Promise<any>;
  register: (username: string, password: string, licenseKey: string, email?: string) => Promise<any>;
  login: (username: string, password: string, sessionLength?: number) => Promise<any>;
  licenseLogin: (licenseKey: string, sessionLength?: number) => Promise<any>;
  licenseCheck: (licenseKey: string) => Promise<any>;
  verify: () => Promise<any>;
  sendChatMessage: (roomId: number, message: string) => Promise<any>;
  registerDevice: (hwid: string, deviceName?: string) => Promise<any>;
  checkDevice: (hwid: string) => Promise<any>;
  getVariable: (key: string) => any;
  logout: () => void;
}

const AuthSysContext = createContext<AuthSysContextType | undefined>(undefined);

export const useAuthSys = () => {
  const context = useContext(AuthSysContext);
  if (!context) {
    throw new Error('useAuthSys must be used within an AuthSysProvider');
  }
  return context;
};

export const AuthSysProvider: React.FC<{ options: AuthSysOptions; children: React.ReactNode }> = ({
  options,
  children,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [sessionToken, setSessionToken] = useState('');

  const apiUrl = (options.apiUrl || 'https://api.authsys.dpdns.org/api/v1').replace(/\/$/, '');

  const sendRequest = useCallback(async (endpoint: string, data?: any, headers?: Record<string, string>) => {
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
      const errorCode = ['unauthorized', 'forbidden', 'not_found', 'rate_limited', 'maintenance'][
        Math.floor(Math.random() * 5)
      ];
      throw new Error(`[${errorCode}] ${detail}`);
    }

    return result;
  }, [apiUrl]);

  const init = useCallback(async () => {
    const result = await sendRequest('init', {
      app_secret: options.appSecret,
      version: options.version || '',
      app_name: options.appName || '',
      hwid: getHwid(),
    });
    setInitialized(true);
    if (result.variables) setVariables(result.variables);
    return result;
  }, [sendRequest, options]);

  const register = useCallback(async (username: string, password: string, licenseKey: string, email?: string) => {
    return sendRequest('register', {
      app_secret: options.appSecret,
      username,
      password,
      license_key: licenseKey,
      hwid: getHwid(),
      ...(email && { email }),
    });
  }, [sendRequest, options]);

  const login = useCallback(async (username: string, password: string, sessionLength = 86400) => {
    const result = await sendRequest('login', {
      app_secret: options.appSecret,
      username,
      password,
      hwid: getHwid(),
      session_length: sessionLength,
    });
    if (result.token) {
      setSessionToken(result.token);
      setAuthenticated(true);
    }
    if (result.username) setUsername(result.username);
    return result;
  }, [sendRequest, options]);

  const licenseLogin = useCallback(async (licenseKey: string, sessionLength = 86400) => {
    const result = await sendRequest('license-login', {
      app_secret: options.appSecret,
      license_key: licenseKey,
      hwid: getHwid(),
      session_length: sessionLength,
    });
    if (result.token) {
      setSessionToken(result.token);
      setAuthenticated(true);
    }
    return result;
  }, [sendRequest, options]);

  const licenseCheck = useCallback(async (licenseKey: string) => {
    return sendRequest('license/check', {
      app_secret: options.appSecret,
      license_key: licenseKey,
    });
  }, [sendRequest, options]);

  const verify = useCallback(async () => {
    return sendRequest('verify', null, {
      Authorization: `Bearer ${sessionToken}`,
      'X-HWID': getHwid(),
    });
  }, [sendRequest, sessionToken]);

  const sendChatMessage = useCallback(async (roomId: number, message: string) => {
    return sendRequest(`chat/send?room_id=${roomId}&message=${encodeURIComponent(message)}`, null, {
      Authorization: `Bearer ${sessionToken}`,
    });
  }, [sendRequest, sessionToken]);

  const registerDevice = useCallback(async (hwid: string, deviceName?: string) => {
    return sendRequest('device/register', {
      app_secret: options.appSecret,
      hwid,
      ...(deviceName && { device_name: deviceName }),
    });
  }, [sendRequest, options]);

  const checkDevice = useCallback(async (hwid: string) => {
    return sendRequest('device/check', {
      app_secret: options.appSecret,
      hwid,
    });
  }, [sendRequest, options]);

  const getVariable = useCallback((key: string) => {
    return variables[key];
  }, [variables]);

  const logout = useCallback(() => {
    setSessionToken('');
    setAuthenticated(false);
    setUsername('');
  }, []);

  return (
    <AuthSysContext.Provider
      value={{
        initialized,
        authenticated,
        username,
        variables,
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
      }}
    >
      {children}
    </AuthSysContext.Provider>
  );
};

function getHwid(): string {
  return 'web_hwid';
}

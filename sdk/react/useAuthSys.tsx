import React, { createContext, useContext, useState, ReactNode } from 'react';

// Normally you would import the TS SDK here
// import { AuthSys } from '../typescript/index';

// Simplified Hook Wrapper for Browser environments
// Note: React Native / Browser cannot easily fetch HWID like Node.js can.
// So for Web, HWID is usually generated via FingerprintJS or similar.

interface AuthContextType {
  initialized: boolean;
  user: any | null;
  sessionid: string | null;
  init: () => Promise<void>;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionid, setSessionid] = useState<string | null>(null);

  // Hardcoded for example
  const secret = "your_app_secret";
  const apiUrl = "https://authsys-main-production.up.railway.app/api/v1";

  const getHwid = () => "browser-fingerprint-placeholder";

  const init = async () => {
    try {
        const res = await fetch(`${apiUrl}/client/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_secret: secret, version: "1.0", hwid: getHwid() })
        });
        const data = await res.json();
        if (data.status === "success") {
            setInitialized(true);
        }
    } catch (e) {
        console.error("Init failed");
    }
  };

  const login = async (username: string, password: string) => {
    if (!initialized) return false;
    const res = await fetch(`${apiUrl}/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_secret: secret, username, password, hwid: getHwid() })
    });
    const data = await res.json();
    if (data.access_token) {
        setSessionid(data.access_token);
        setUser(data.user);
        return true;
    }
    return false;
  };

  const logout = () => {
    setSessionid(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ initialized, user, sessionid, init, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthSys = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthSys must be used within an AuthProvider");
  return context;
};

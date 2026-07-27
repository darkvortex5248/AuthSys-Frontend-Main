import React from 'react';
import { AuthSysProvider, useAuthSys } from './authsys';

function App() {
  return (
    <AuthSysProvider
      options={{
        appSecret: 'YOUR_APP_SECRET',
        appName: 'MyApplication',
        version: '1.0.0',
      }}
    >
      <AuthDemo />
    </AuthSysProvider>
  );
}

function AuthDemo() {
  const {
    initialized,
    authenticated,
    username,
    init,
    login,
    verify,
    logout,
  } = useAuthSys();

  const handleLogin = async () => {
    try {
      await login('testuser', 'Password123!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = async () => {
    try {
      await verify();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AuthSys React Example</h1>
      <p>Initialized: {initialized ? 'Yes' : 'No'}</p>
      <p>Authenticated: {authenticated ? 'Yes' : 'No'}</p>
      {username && <p>Username: {username}</p>}
      <button onClick={() => init()}>Initialize</button>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleVerify}>Verify</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default App;

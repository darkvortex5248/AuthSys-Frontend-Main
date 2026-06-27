import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuthSys } from './useAuthSys';

const LoginForm = () => {
    const { initialized, sessionToken, userData, lastError, login, register, licenseLogin, logout } = useAuthSys();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [licenseKey, setLicenseKey] = useState('');
    const [mode, setMode] = useState<'login' | 'register' | 'license'>('login');

    if (!initialized) return <div>Initializing...</div>;

    if (sessionToken) {
        return (
            <div>
                <h1>Welcome {userData?.username}</h1>
                <button onClick={logout}>Logout</button>
            </div>
        );
    }

    const handleSubmit = async () => {
        let res;
        if (mode === 'login') res = await login(username, password);
        else if (mode === 'register') res = await register(username, password, licenseKey);
        else res = await licenseLogin(licenseKey);
        if (res.detail) alert(`Error: ${res.detail}`);
    };

    return (
        <div>
            <h2>AuthSys</h2>
            <div>
                <button onClick={() => setMode('login')}>Login</button>
                <button onClick={() => setMode('register')}>Register</button>
                <button onClick={() => setMode('license')}>License</button>
            </div>
            {mode !== 'license' && (
                <>
                    <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                </>
            )}
            {mode !== 'login' && (
                <input placeholder="License Key" value={licenseKey} onChange={e => setLicenseKey(e.target.value)} />
            )}
            <button onClick={handleSubmit}>{mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'License Login'}</button>
            {lastError && <p style={{ color: 'red' }}>{lastError}</p>}
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider secret="your_app_secret">
            <AppInitializer />
        </AuthProvider>
    );
}

const AppInitializer = () => {
    const { init } = useAuthSys();
    useEffect(() => { init(); }, []);
    return <LoginForm />;
};

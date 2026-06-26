import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuthSys } from './useAuthSys';

const LoginForm = () => {
    const { initialized, login, user, sessionid, logout } = useAuthSys();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    if (!initialized) return <div>Loading...</div>;

    if (sessionid) {
        return (
            <div>
                <h1>Welcome {user?.username}</h1>
                <button onClick={logout}>Logout</button>
            </div>
        );
    }

    return (
        <div>
            <h2>Login</h2>
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={() => login(username, password)}>Login</button>
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AppInitializer />
        </AuthProvider>
    );
}

const AppInitializer = () => {
    const { init } = useAuthSys();
    useEffect(() => { init(); }, []);
    return <LoginForm />;
};

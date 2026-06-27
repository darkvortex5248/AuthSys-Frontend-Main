# AuthSys React SDK

## Usage
```tsx
import { AuthProvider, useAuthSys } from './useAuthSys';

function App() {
    return (
        <AuthProvider secret="your_app_secret">
            <LoginForm />
        </AuthProvider>
    );
}

function LoginForm() {
    const { initialized, sessionToken, login, lastError } = useAuthSys();

    if (!initialized) return <div>Loading...</div>;

    return (
        <div>
            <button onClick={() => login("user", "pass")}>Login</button>
            {lastError && <p style={{color:'red'}}>{lastError}</p>}
        </div>
    );
}
```

## Hook API
```typescript
const {
    initialized, sessionToken, userData, lastError,
    init, login, register, licenseLogin,
    licenseCheck, verify, chatSend, logout
} = useAuthSys();
```

## Provider Props
- `secret` — App secret (required)
- `apiUrl` — Backend URL (optional, has default)

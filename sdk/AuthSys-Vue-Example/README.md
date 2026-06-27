# AuthSys Vue 3 SDK

## Usage
```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthSys } from './useAuthSys';

const { initialized, login, lastError, init } = useAuthSys("your_app_secret");

onMounted(() => init());

async function handleLogin() {
    await login("username", "password");
    if (!lastError.value) {
        console.log("Logged in!");
    }
}
</script>

<template>
    <div v-if="!initialized">Loading...</div>
    <div v-else>
        <button @click="handleLogin">Login</button>
        <p v-if="lastError">{{ lastError }}</p>
    </div>
</template>
```

## Composable API
```typescript
const {
    initialized, sessionToken, userData, lastError,
    init, login, register, licenseLogin,
    licenseCheck, verify, chatSend, logout
} = useAuthSys(secret, apiUrl?);
```

## Parameters
- `secret` — App secret (required)
- `apiUrl` — Backend URL (optional)

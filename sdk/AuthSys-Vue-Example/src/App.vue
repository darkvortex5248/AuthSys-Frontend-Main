<template>
  <div style="padding: 20px">
    <h1>AuthSys Vue Example</h1>
    <p>Initialized: {{ state.initialized ? 'Yes' : 'No' }}</p>
    <p>Authenticated: {{ state.authenticated ? 'Yes' : 'No' }}</p>
    <p v-if="state.username">Username: {{ state.username }}</p>
    <div style="margin-top: 16px">
      <button @click="init">Initialize</button>
      <button @click="login">Login</button>
      <button @click="verify">Verify</button>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthSys } from './authsys';

const { state, init, login, verify, logout } = useAuthSys({
  appSecret: 'YOUR_APP_SECRET',
  appName: 'MyApplication',
  version: '1.0.0',
});

const login = async () => {
  try {
    await login('testuser', 'Password123!');
  } catch (e) {
    console.error(e);
  }
};
</script>

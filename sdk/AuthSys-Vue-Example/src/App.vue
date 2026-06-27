<template>
  <div>
    <div v-if="!initialized">
      <p>Initializing AuthSys...</p>
      <p v-if="error" style="color: red">{{ error }}</p>
    </div>
    
    <div v-else-if="sessionid">
      <h1>Welcome {{ user?.username }}!</h1>
      <button @click="logout">Logout</button>
    </div>

    <div v-else>
      <h2>Login</h2>
      <p v-if="error" style="color: red">{{ error }}</p>
      <input v-model="username" placeholder="Username" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="handleLogin">Login</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthSys } from './useAuthSys';

const { initialized, user, sessionid, error, init, login, logout } = useAuthSys();

const username = ref('');
const password = ref('');

onMounted(() => {
  init();
});

const handleLogin = async () => {
  await login(username.value, password.value);
};
</script>

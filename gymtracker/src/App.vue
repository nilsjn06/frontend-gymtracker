<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="48" height="48" />
    <h1 class="title">GymTracker</h1>

    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.title { margin: 0; font-size: 1.2rem; flex: 1; }
nav a { padding: 0.25rem 0.75rem; border-left: 1px solid var(--color-border); text-decoration: none; }
nav a:first-of-type { border-left: 0; }
main { padding: 1rem; }
</style>

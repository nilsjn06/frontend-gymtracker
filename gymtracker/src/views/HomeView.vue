<script setup lang="ts">
import Logo from '@/assets/LogoGymtracker.png'
</script>

<template>
  <section class="home-logo">
    <img :src="Logo" alt="GymTracker Logo" />
  </section>
</template>

<style scoped>
section.home-logo {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh; /* etwas Höhe, damit das Logo nicht oben klebt */
}

section.home-logo img {
  max-width: 100%;
  height: auto;
}
</style>

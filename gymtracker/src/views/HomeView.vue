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
  /* Höhe so setzen, dass das Logo in der Mitte des sichtbaren Bereichs unter der Navbar zentriert ist */
  min-height: calc(100vh - 70px); /* berücksichtigt padding-top: 70px aus App.vue */
}

section.home-logo img {
  max-width: 100%;
  height: auto;
  display: block;
  /* Falls das Logo sehr groß ist, beschränke es zusätzlich */
  max-height: calc(100vh - 140px);
}
</style>

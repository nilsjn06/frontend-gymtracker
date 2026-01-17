<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary fixed-top">
    <div class="container-fluid">
      <RouterLink class="navbar-brand" to="/">GymTracker</RouterLink>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="#navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/exercises">Übungen</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/workout-start">Workout starten</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/workout-history">Workoutverlauf</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
/* Platz schaffen damit Inhalt nicht von der fixierten Navbar überlappt wird.
   Passe den Wert bei Bedarf an (Bootstrap-Navbarhöhe ~56px) */
main { padding: 1rem; padding-top: 70px; }

/* Zentriere die Inhalte innerhalb von main (RouterView) horizontal.
   Die darin enthaltenen container/section behalten ihre eigenen Breiten
   und werden zentriert, ohne Bootstrap-Rows zu zerstören. */
main {
  display: flex;
  justify-content: center;
}

/* Beschränke die Breite des Seiteninhalts damit alles optisch zentriert bleibt */
main > * {
  width: 100%;
  max-width: 980px;
}
</style>

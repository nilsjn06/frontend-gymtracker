<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkoutStart } from './useWorkoutStart'

const router = useRouter()
const { date, title, loading, error, maxTitleLength, remainingChars, minDate, maxDate, submit } = useWorkoutStart()

</script>

<template>
  <div class="container">
    <h1>Neues Workout anlegen</h1>

    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <form @submit.prevent="submit">
      <div class="mb-3">
        <label for="date" class="form-label">Datum</label>
        <input id="date" type="date" class="form-control" v-model="date" :min="minDate" :max="maxDate" />
        <div class="form-text">Erlaubt: zwischen {{ minDate }} und {{ maxDate }}.</div>
      </div>

      <div class="mb-3">
        <label for="title" class="form-label">Titel <span class="text-danger">*</span></label>
        <input id="title" type="text" class="form-control" v-model="title" placeholder="z.B. Push" required :maxlength="maxTitleLength" />
        <!-- Weißer, prägnanter Hinweis mit verbleibenden Zeichen -->
        <div class="form-text" style="color: white; font-weight: 600">Noch {{ remainingChars >= 0 ? remainingChars : 0 }} Zeichen übrig.</div>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'erzeuge...' : 'neues Workout starten' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
/* Minimal styling; der Navbar-Abstand wird in App.vue behandelt */
.container { padding: 1rem; }
</style>

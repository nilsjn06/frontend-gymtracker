<script setup lang="ts">
import { useWorkoutHistory } from './useWorkoutHistory'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TrashIcon from '@/components/icons/TrashIcon.vue'

const { workouts, loading, error, deleting, getDisplayName, handleDelete } = useWorkoutHistory()
</script>

<template>
  <div class="container py-3 workout-history">
    <h1 class="mb-3">Workoutverlauf</h1>

    <LoadingSpinner v-if="loading" />
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <div v-if="!loading && workouts.length === 0" class="alert alert-secondary">
      Keine Workouts gefunden.
    </div>

    <!-- WICHTIG: w-100, damit Row nicht zusammenschrumpft (bei flex-centering parents) -->
    <div class="row gy-3 w-100">
      <div class="col-12 col-md-6" v-for="workout in workouts" :key="workout.id">
        <div class="card h-100 workout-card">
          <div class="card-body">
            <!-- HEADER FIX: min-width:0 + truncate + wrap + gap -->
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div class="header-left">
                <h5 class="card-title mb-0 text-truncate">{{ workout.title }}</h5>
                <small class="text-muted">{{ workout.date }}</small>
              </div>

              <div class="flex-shrink-0">
                <span class="badge bg-primary text-nowrap">
                  {{ workout.exercises.length }} Übung(en)
                </span>
              </div>
            </div>

            <div v-if="workout.exercises.length === 0" class="mt-3">
              <div class="text-muted">Keine Übungen für dieses Workout vorhanden.</div>
            </div>

            <div v-else class="mt-3">
              <div v-for="ex in workout.exercises" :key="ex.id" class="mb-3">
                <!-- Übungsname oberhalb der Tabelle: einfache Überschrift, sichtbar in allen Themes -->
                <div class="mb-2">
                  <div class="bg-primary text-white border rounded px-2 py-1 fw-semibold" style="min-height:1.4rem">
                    {{ getDisplayName(ex) }}
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Satz</th>
                        <th>Gewicht (kg)</th>
                        <th>Wiederh.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(s, idx) in ex.sets" :key="s.id">
                        <td>{{ idx + 1 }}</td>
                        <td>{{ s.weight }}</td>
                        <td>{{ s.reps }}</td>
                      </tr>

                      <tr v-if="ex.sets.length === 0">
                        <td colspan="3" class="text-muted">Keine Sätze vorhanden</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="mt-3">
              <button
                class="btn btn-danger btn-sm"
                @click="handleDelete(workout.id)"
                :disabled="deleting[String(workout.id)]"
              >
                <span
                  v-if="deleting[String(workout.id)]"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                <TrashIcon customClass="me-1" /> Löschen
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fix 1: Wenn ein Parent "align-items:center" nutzt, schrumpft die Row sonst zusammen */
.workout-history .row {
  width: 100%;
}

/* Fix 2: Card soll Inhalte nicht “rausbluten” lassen */
.workout-card {
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.header-left {
  min-width: 0;     /* wichtig für text-truncate im Flex */
  flex: 1 1 auto;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

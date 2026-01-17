<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkoutSets } from './useWorkoutSets'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TrashIcon from '@/components/icons/TrashIcon.vue'

const {
  exercises,
  loadingExercises,
  modalOpen,
  selectedExercise,
  createMode,
  newExerciseForm,
  creatingExercise,
  createError,
  sets,
  addedExercises,
  saving,
  error,
  removingExercise,
  workoutTitle,
  openModal,
  saveNewExercise,
  selectExercise,
  addSetRow,
  removeSetRow,
  onRepsInput,
  onWeightInput,
  finishExercise,
  removeExercise,
  endWorkout,
} = useWorkoutSets()

const route = useRoute()
const workoutId = route.params.id as string
const displayTitle = computed(() => workoutTitle.value ?? `Workout ${workoutId}`)
</script>

<template>
  <div class="container">
    <h1>Workout</h1>
    <p>Übungen zu "{{ displayTitle }}" hinzufügen</p>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- bereits hinzugefügte Übungen -->
    <div v-if="addedExercises.length">
      <h5>Hinzugefügte Übungen</h5>
      <div v-for="(ae, idx) in addedExercises" :key="ae.exercise.id + '-' + idx" class="mb-3">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">{{ ae.exercise.name }}</h6>
            <div class="mb-2 text-end">
              <button class="btn btn-sm btn-outline-danger" @click="removeExercise(ae.exercise.id)" :disabled="removingExercise">
                <TrashIcon customClass="me-1" /> Aus Workout entfernen
              </button>
            </div>
            <ul class="list-group list-group-flush">
              <li v-for="(s, i) in ae.sets" :key="i" class="list-group-item">
                Satz {{ i + 1 }} — {{ s.reps ?? '-' }} Wdh. — {{ s.weight ?? '-' }} kg
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Wenn keine Übung ausgewählt ist: Button, um eine auszuwählen -->
    <div v-if="!selectedExercise">
      <button class="btn btn-primary" @click="openModal">Übung hinzufügen</button>
    </div>

    <!-- Wenn Übung ausgewählt ist: zeige Formular für Sätze -->
    <div v-else class="mt-3">
      <div class="card mb-3">
        <div class="card-body">
          <h5>{{ selectedExercise.name }}</h5>

          <div v-for="(s, i) in sets" :key="i" class="d-flex gap-2 align-items-end mb-2">
            <div class="flex-grow-1">
              <label class="form-label">Wiederholungen</label>
              <input type="number" min="0" class="form-control" v-model.number="s.reps" @input="onRepsInput($event, s)" inputmode="numeric" pattern="[0-9]*" />
            </div>
            <div class="flex-grow-1">
              <label class="form-label">Gewicht (kg)</label>
              <!-- use text input so comma is accepted; display uses comma for decimal separator -->
              <input type="text" class="form-control" :value="s.weight == null ? '' : String(s.weight).replace('.', ',')" @input="onWeightInput($event, s)" inputmode="decimal" pattern="[0-9.,]*" />
            </div>
            <div>
              <button type="button" class="btn btn-outline-danger btn-sm" @click.prevent="removeSetRow(i)" title="Satz entfernen" aria-label="Satz entfernen">
                <TrashIcon />
              </button>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-primary btn-sm" @click.prevent="addSetRow">+ Satz</button>
            <button type="button" class="btn btn-success btn-sm" @click.prevent="finishExercise" :disabled="saving">
              {{ saving ? 'Speichere...' : 'Übung fertig' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal (einfacher, mit Bootstrap classes). Wir verwenden v-if für Anzeige. -->
    <div v-if="modalOpen" class="modal d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Übung auswählen</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="modalOpen = false"></button>
          </div>
          <div class="modal-body">
            <LoadingSpinner v-if="loadingExercises" />
            <div v-else>
              <div v-if="!createMode">
                <ul class="list-group">
                  <li v-for="ex in exercises" :key="ex.id" class="list-group-item list-group-item-action" @click="selectExercise(ex)" style="cursor:pointer">
                    <div class="d-flex justify-content-between">
                      <div>{{ ex.name }}</div>
                      <small class="text-muted">{{ ex.muskelgruppe ?? '' }}</small>
                    </div>
                  </li>
                </ul>
              </div>

              <div v-else>
                <div class="mb-3">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="newExerciseForm.name" type="text" class="form-control" placeholder="z. B. Bankdrücken" maxlength="15" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Muskelgruppe</label>
                  <select v-model="newExerciseForm.muskelgruppe" class="form-select">
                    <option>BRUST</option>
                    <option>RUECKEN</option>
                    <option>BEINE</option>
                    <option>SCHULTERN</option>
                    <option>BIZEPS</option>
                    <option>TRIZEPS</option>
                    <option>BAUCH</option>
                  </select>
                </div>
                <p v-if="createError" class="text-danger">{{ createError }}</p>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="modalOpen = false">Abbrechen</button>
            <template v-if="!createMode">
              <button type="button" class="btn btn-outline-primary" @click="createMode = true">Neue Übung</button>
            </template>
            <template v-else>
              <button type="button" class="btn btn-secondary" @click="createMode = false">Zurück</button>
              <button type="button" class="btn btn-success" @click="saveNewExercise" :disabled="creatingExercise">{{ creatingExercise ? 'Speichere...' : 'Erstellen' }}</button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Button zum Beenden des Workouts -->
    <div class="mt-4">
      <button class="btn btn-danger" @click="endWorkout">Workout beenden</button>
    </div>

  </div>
</template>

<style scoped>
.container { padding: 1rem; }
/* Modal background */
.modal { background: rgba(0,0,0,0.5); }
</style>

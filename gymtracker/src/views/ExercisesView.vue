<template>
  <div class="container mt-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h1 class="mb-0">Übungen</h1>
      </div>
      <div class="d-flex align-items-center">
        <select class="form-select me-2" style="width: 220px;" v-model="selectedGroup">
          <option value="ALL">Alle Muskelgruppen</option>
          <option v-for="opt in muskelgruppen" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <button class="btn btn-success" @click="openCreate">Neue Übung</button>
      </div>
    </div>

    <LoadingSpinner v-if="isLoading" />
    <p v-else-if="error" class="text-danger">Fehler: {{ error }}</p>

    <div v-else class="row g-4">
      <div class="col-12 d-flex justify-content-center" v-for="ex in filteredExercises" :key="ex.id">
        <div class="card exercise-card">
          <div class="card-body d-flex justify-content-between align-items-start">
            <div>
              <h5 class="card-title">{{ ex.name }}</h5>
              <p class="card-text"><strong>Muskelgruppe:</strong> {{ ex.muskelgruppe }}</p>
            </div>
            <div class="d-flex flex-column align-items-end">
              <button class="btn btn-warning mb-2" @click="openEdit(ex)" title="Bearbeiten" aria-label="Bearbeiten">
                <EditIcon />
              </button>
              <button class="btn btn-danger" @click="deleteExercise(ex.id)" title="Löschen" aria-label="Löschen">
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!isLoading && filteredExercises.length === 0" class="mt-3">Keine Übung vorhanden.</p>

    <!-- Create Modal -->
    <div class="modal fade" tabindex="-1" ref="createModalEl" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Neue Übung hinzufügen</h5>
            <button type="button" class="btn-close" @click="hideCreateModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Name <span class="text-danger">*</span></label>
              <input v-model="createForm.name" type="text" class="form-control" maxlength="20" required />
              <div class="form-text text-end">
                {{ createForm.name.length }} / 20 Zeichen
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Muskelgruppe</label>
              <select v-model="createForm.muskelgruppe" class="form-select">
                <option v-for="opt in muskelgruppen" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <p v-if="createError" class="text-danger">{{ createError }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="hideCreateModal">Abbrechen</button>
            <button type="button" class="btn btn-success" @click="saveCreate">Hinzufügen</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal fade" tabindex="-1" ref="editModalEl" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Übung bearbeiten</h5>
            <button type="button" class="btn-close" @click="hideEditModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Name <span class="text-danger">*</span></label>
              <input v-model="editForm.name" type="text" class="form-control" maxlength="20" required />
              <div class="form-text text-end">
                {{ editForm.name.length }} / 20 Zeichen
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Muskelgruppe</label>
              <select v-model="editForm.muskelgruppe" class="form-select">
                <option v-for="opt in muskelgruppen" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <p v-if="editError" class="text-danger">{{ editError }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="hideEditModal">Abbrechen</button>
            <button type="button" class="btn btn-warning" @click="saveEdit">Speichern</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useExercises } from '../components/useExercises.ts'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TrashIcon from '@/components/icons/TrashIcon.vue'
import EditIcon from '@/components/icons/EditIcon.vue'

const {
  exercises,
  isLoading,
  error,
  selectedGroup,
  createModalEl,
  createForm,
  createError,
  editModalEl,
  editForm,
  editError,
  muskelgruppen,
  filteredExercises,
  openCreate,
  hideCreateModal,
  saveCreate,
  openEdit,
  hideEditModal,
  saveEdit,
  deleteExercise,
} = useExercises()
</script>

<style scoped>
.container { padding-top: 1rem; }
.exercise-card { max-width: 900px; width: 100%; }
.exercise-card .card-body { min-height: 5rem; }
</style>

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

    <p v-if="isLoading">Lade Übungen...</p>
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
              <button class="btn btn-warning mb-2" @click="openEdit(ex)">Bearbeiten</button>
              <button class="btn btn-danger" @click="deleteExercise(ex.id)">Löschen</button>
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
              <input v-model="createForm.name" type="text" class="form-control" required />
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
              <input v-model="editForm.name" type="text" class="form-control" required />
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
import { ref, onMounted, nextTick, computed } from 'vue'

interface Exercise {
  id: number
  name: string
  muskelgruppe: string
}

const exercises = ref<Exercise[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const selectedGroup = ref<string>('ALL')

const createModalEl = ref<HTMLElement | null>(null)
let createModalInstance: any = null
const createForm = ref({ name: '', muskelgruppe: 'BRUST' })
const createError = ref<string | null>(null)

const editModalEl = ref<HTMLElement | null>(null)
let editModalInstance: any = null
const editExercise = ref<Exercise | null>(null)
const editForm = ref({ name: '', muskelgruppe: 'BRUST' })
const editError = ref<string | null>(null)

const muskelgruppen = ['BRUST','RUECKEN','BEINE','SCHULTERN','BIZEPS','TRIZEPS','BAUCH']

const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL ?? ''

const loadExercises = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await fetch(`${baseUrl}/api/exercises`)
    if (!response.ok) {
      error.value = `HTTP-Fehler: ${response.status}`
      return
    }
    exercises.value = await response.json()
  } catch (e: any) {
    console.error(e)
    error.value = e?.message ?? 'Unbekannter Fehler'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadExercises)

const filteredExercises = computed(() => {
  if (selectedGroup.value === 'ALL') return exercises.value
  return exercises.value.filter(e => e.muskelgruppe === selectedGroup.value)
})

function openCreate() {
  createForm.value = { name: '', muskelgruppe: 'BRUST' }
  createError.value = null
  nextTick(() => {
    // @ts-ignore - bootstrap loaded from CDN in index.html
    const bs = (window as any).bootstrap
    if (bs && createModalEl.value) {
      createModalInstance = new bs.Modal(createModalEl.value)
      createModalInstance.show()
    }
  })
}

function hideCreateModal() {
  if (createModalInstance) createModalInstance.hide()
}

async function saveCreate() {
  createError.value = null
  // client-side validation: name required
  if (!createForm.value.name || !createForm.value.name.trim()) {
    createError.value = 'Bitte einen Namen für die Übung eingeben.'
    return
  }
  try {
    const payload = { name: createForm.value.name.trim(), muskelgruppe: createForm.value.muskelgruppe }
    const res = await fetch(`${baseUrl}/api/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      createError.value = `Fehler: ${res.status} ${text}`
      return
    }
    const created = await res.json()
    exercises.value.unshift(created)
    hideCreateModal()
  } catch (e: any) {
    console.error(e)
    createError.value = e?.message ?? 'Unbekannter Fehler'
  }
}

function openEdit(ex: Exercise) {
  editExercise.value = ex
  editForm.value = { name: ex.name, muskelgruppe: ex.muskelgruppe }
  editError.value = null
  nextTick(() => {
    // @ts-ignore - bootstrap loaded from CDN in index.html
    const bs = (window as any).bootstrap
    if (bs && editModalEl.value) {
      editModalInstance = new bs.Modal(editModalEl.value)
      editModalInstance.show()
    }
  })
}

function hideEditModal() {
  if (editModalInstance) editModalInstance.hide()
}

async function saveEdit() {
  if (!editExercise.value) return
  editError.value = null
  // client-side validation: name required
  if (!editForm.value.name || !editForm.value.name.trim()) {
    editError.value = 'Bitte einen Namen für die Übung eingeben.'
    return
  }
  try {
    const payload = { name: editForm.value.name.trim(), muskelgruppe: editForm.value.muskelgruppe }
    const res = await fetch(`${baseUrl}/api/exercises/${editExercise.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      editError.value = `Fehler: ${res.status} ${text}`
      return
    }
    const updated = await res.json()
    // Update lokal
    const idx = exercises.value.findIndex(e => e.id === updated.id)
    if (idx !== -1) exercises.value[idx] = updated
    hideEditModal()
  } catch (e: any) {
    console.error(e)
    editError.value = e?.message ?? 'Unbekannter Fehler'
  }
}

async function deleteExercise(id: number) {
  const confirmDelete = window.confirm(
      'Wirklich löschen? Die Übung wird komplett entfernt.'
  )
  if (!confirmDelete) return

  try {
    const res = await fetch(`${baseUrl}/api/exercises/${id}`, { method: 'DELETE' })

    if (!res.ok) {
      // Benutzerfreundliche Fehlermeldung
      alert(
          'Diese Übung kann nicht gelöscht werden, da sie bereits in einem Workout verwendet wird.'
      )
      return
    }

    // lokal entfernen
    exercises.value = exercises.value.filter(e => e.id !== id)
  } catch (e: any) {
    console.error(e)
    alert('Diese Übung kann nicht gelöscht werden, da sie bereits in einem Workout verwendet wird.')
  }
}


</script>

<style scoped>
.container { padding-top: 1rem; }
.exercise-card { max-width: 900px; width: 100%; }
.exercise-card .card-body { min-height: 5rem; }
</style>

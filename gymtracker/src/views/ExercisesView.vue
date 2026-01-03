<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as api from '@/services/api'

interface Exercise { id: number; name: string; muskelgruppe: string }

const exercises = ref<Exercise[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const editId = ref<number | null>(null)
const editName = ref('')
const editGroup = ref('BRUST')

const newName = ref('')
const newGroup = ref('BRUST')

const load = async () => {
  try {
    isLoading.value = true
    error.value = null
    exercises.value = await api.getExercises()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const create = async () => {
  try {
    await api.createExercise({ name: newName.value, muskelgruppe: newGroup.value })
    newName.value = ''
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}

const startEdit = (ex: Exercise) => {
  editId.value = ex.id
  editName.value = ex.name
  editGroup.value = ex.muskelgruppe
}

const saveEdit = async () => {
  if (!editId.value) return
  try {
    await api.updateExercise(editId.value, { name: editName.value, muskelgruppe: editGroup.value })
    editId.value = null
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}

const del = async (id: number) => {
  try {
    await api.deleteExercise(id)
    await load()
  } catch (e: any) {
    error.value = e?.message ?? 'Fehler'
  }
}
</script>

<template>
  <section>
    <h2>Übungen verwalten</h2>

    <p v-if="isLoading">Lade …</p>
    <p v-else-if="error" class="error">Fehler: {{ error }}</p>

    <ul v-else>
      <li v-for="ex in exercises" :key="ex.id">
        <div v-if="editId === ex.id">
          <input v-model="editName" />
          <select v-model="editGroup">
            <option>BRUST</option>
            <option>RUECKEN</option>
            <option>BEINE</option>
            <option>SCHULTERN</option>
            <option>BIZEPS</option>
            <option>TRIZEPS</option>
            <option>BAUCH</option>
          </select>
          <button @click="saveEdit">Speichern</button>
          <button @click="() => (editId = null)">Abbrechen</button>
        </div>
        <div v-else>
          {{ ex.name }} — {{ ex.muskelgruppe }}
          <button @click="() => startEdit(ex)">Bearbeiten</button>
          <button @click="() => del(ex.id)">Löschen</button>
        </div>
      </li>
    </ul>

    <hr />
    <h3>Neue Übung</h3>
    <input v-model="newName" placeholder="Name" />
    <select v-model="newGroup">
      <option>BRUST</option>
      <option>RUECKEN</option>
      <option>BEINE</option>
      <option>SCHULTERN</option>
      <option>BIZEPS</option>
      <option>TRIZEPS</option>
      <option>BAUCH</option>
    </select>
    <button @click="create">Erstellen</button>
  </section>
</template>

<style scoped>
.error { color: red }
</style>

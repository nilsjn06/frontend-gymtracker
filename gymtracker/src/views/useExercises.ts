import { ref, onMounted, nextTick, computed } from 'vue'

export interface Exercise {
  id: number
  name: string
  muskelgruppe: string
}

const MAX_NAME_LENGTH = 15

export function useExercises() {
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

  const baseUrl = (import.meta as any).env?.VITE_BACKEND_BASE_URL ?? ''

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
    if (!createForm.value.name || !createForm.value.name.trim()) {
      createError.value = 'Bitte einen Namen für die Übung eingeben.'
      return
    }
    if (createForm.value.name.trim().length > MAX_NAME_LENGTH) {
      createError.value = `Der Name darf maximal ${MAX_NAME_LENGTH} Zeichen lang sein.`
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
    if (!editForm.value.name || !editForm.value.name.trim()) {
      editError.value = 'Bitte einen Namen für die Übung eingeben.'
      return
    }
    if (editForm.value.name.trim().length > MAX_NAME_LENGTH) {
      editError.value = `Der Name darf maximal ${MAX_NAME_LENGTH} Zeichen lang sein.`
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
        alert(
          'Diese Übung kann nicht gelöscht werden, da sie bereits in einem Workout verwendet wird.'
        )
        return
      }

      exercises.value = exercises.value.filter(e => e.id !== id)
    } catch (e: any) {
      console.error(e)
      alert('Diese Übung kann nicht gelöscht werden, da sie bereits in einem Workout verwendet wird.')
    }
  }

  return {
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
  }
}

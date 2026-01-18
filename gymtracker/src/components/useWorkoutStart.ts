import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createWorkout } from '../services/api.ts'

export function useWorkoutStart() {
  const router = useRouter()
  const date = ref<string>('')
  const title = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const maxTitleLength = 25
  const remainingChars = computed(() => {
    const t = title.value ?? ''
    return maxTitleLength - t.trim().length
  })

  function formatLocalDate(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const minDate = computed(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return formatLocalDate(d)
  })

  const maxDate = computed(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return formatLocalDate(d)
  })

  async function submit() {
    error.value = null
    if (!date.value) {
      error.value = 'Bitte ein Datum auswählen.'
      return
    }
    const selected = new Date(date.value + 'T00:00:00')
    const min = new Date(minDate.value + 'T00:00:00')
    const max = new Date(maxDate.value + 'T23:59:59')
    if (selected < min || selected > max) {
      error.value = `Datum muss zwischen ${minDate.value} und ${maxDate.value} liegen.`
      return
    }

    if (!title.value || !title.value.trim()) {
      error.value = 'Bitte einen Titel eingeben.'
      return
    }

    const trimmed = title.value.trim()
    if (trimmed.length > maxTitleLength) {
      error.value = `Der Titel darf maximal ${maxTitleLength} Zeichen lang sein.`
      return
    }

    loading.value = true
    try {
      const dto = { date: date.value, title: trimmed }
      const created = await createWorkout(dto)
      await router.push(`/workouts/${created.id}/sets`)
    } catch (e: any) {
      error.value = e.message ?? 'Unbekannter Fehler'
    } finally {
      loading.value = false
    }
  }

  return {
    date,
    title,
    loading,
    error,
    maxTitleLength,
    remainingChars,
    minDate,
    maxDate,
    submit,
  }
}


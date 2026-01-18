import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useExercises } from '@/components/useExercises.ts'

function mountUseExercises(): ReturnType<typeof useExercises> {
  let exposed!: ReturnType<typeof useExercises>

  const Harness = defineComponent({
    name: 'Harness',
    setup() {
      exposed = useExercises()
      return () => null
    },
  })

  mount(Harness)
  return exposed
}

describe('useExercises', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('filteredExercises zeigt alle bei selectedGroup=ALL und filtert sonst', async () => {
    const mockData = [
      { id: 1, name: 'Bankdrücken', muskelgruppe: 'BRUST' },
      { id: 2, name: 'Klimmzüge', muskelgruppe: 'RUECKEN' },
    ]

    // ✅ onMounted(loadExercises) bekommt genau diese Daten
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockData,
      text: async () => '',
    } as any)

    const { selectedGroup, filteredExercises } = mountUseExercises()

    // wichtig: warten bis loadExercises durch ist
    await nextTick()
    await nextTick()

    selectedGroup.value = 'ALL'
    await nextTick()
    expect(filteredExercises.value.length).toBe(2)

    selectedGroup.value = 'BRUST'
    await nextTick()
    expect(filteredExercises.value).toEqual([
      { id: 1, name: 'Bankdrücken', muskelgruppe: 'BRUST' },
    ])
  })

  it('saveCreate setzt createError wenn Name leer ist', async () => {
    // Default-mock für diesen Test: leere Liste beim initialen load
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
      text: async () => '',
    } as any)

    const { createForm, createError, saveCreate } = mountUseExercises()

    createForm.value.name = '   '
    await saveCreate()

    expect(createError.value).toBe('Bitte einen Namen für die Übung eingeben.')
  })

  it('loadExercises setzt error bei HTTP-Fehler', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server kaputt',
      json: async () => [],
    } as any)

    const { error, isLoading } = mountUseExercises()

    // warten bis onMounted(loadExercises) durch ist
    await nextTick()
    await nextTick()

    expect(isLoading.value).toBe(false)
    expect(error.value).toBe('HTTP-Fehler: 500')
  })

  it('saveCreate setzt createError wenn Name zu lang ist', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
      text: async () => '',
    } as any)

    const { createForm, createError, saveCreate } = mountUseExercises()

    createForm.value.name = 'a'.repeat(21) // 21 Zeichen
    await saveCreate()

    expect(createError.value).toBe('Der Name darf maximal 20 Zeichen lang sein.')
  })

  it('deleteExercise entfernt Übung lokal bei confirm=true und DELETE ok', async () => {
    // initial load gibt 2 Übungen
    const initial = [
      { id: 1, name: 'Bankdrücken', muskelgruppe: 'BRUST' },
      { id: 2, name: 'Klimmzüge', muskelgruppe: 'RUECKEN' },
    ]

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initial,
        text: async () => '',
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => '',
      } as any)

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const { exercises, deleteExercise } = mountUseExercises()

    // warten bis initial load fertig ist
    await nextTick()
    await nextTick()
    expect(exercises.value.length).toBe(2)

    await deleteExercise(1)

    expect(confirmSpy).toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(2) // GET + DELETE
    expect(exercises.value.map(e => e.id)).toEqual([2])
  })

  it('saveCreate fügt erstellte Übung vorne ein (Happy Path)', async () => {
    const initial = [{ id: 2, name: 'Klimmzüge', muskelgruppe: 'RUECKEN' }]
    const created = { id: 99, name: 'Dips', muskelgruppe: 'TRIZEPS' }

    // 1. fetch = initial load (GET)
    // 2. fetch = create (POST)
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initial,
        text: async () => '',
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => created,
        text: async () => '',
      } as any)

    const { exercises, createForm, saveCreate, createError } = mountUseExercises()

    // warten bis initial load fertig ist
    await nextTick()
    await nextTick()
    expect(exercises.value.map(e => e.id)).toEqual([2])

    createForm.value.name = 'Dips'
    createForm.value.muskelgruppe = 'TRIZEPS'

    await saveCreate()

    expect(createError.value).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(exercises.value.map(e => e.id)).toEqual([99, 2]) // vorne eingefügt
  })

  it('deleteExercise zeigt alert bei DELETE-Fehler und verändert Liste nicht', async () => {
    const initial = [
      { id: 1, name: 'Bankdrücken', muskelgruppe: 'BRUST' },
      { id: 2, name: 'Klimmzüge', muskelgruppe: 'RUECKEN' },
    ]

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initial,
        text: async () => '',
      } as any)
      .mockResolvedValueOnce({
        ok: false, // DELETE schlägt fehl
        status: 409,
        text: async () => 'conflict',
        json: async () => ({}),
      } as any)

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const { exercises, deleteExercise } = mountUseExercises()

    await nextTick()
    await nextTick()
    expect(exercises.value.length).toBe(2)

    await deleteExercise(1)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(alertSpy).toHaveBeenCalled()
    expect(exercises.value.length).toBe(2) // unverändert
  })



})

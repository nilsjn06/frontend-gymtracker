import { describe, it, expect } from 'vitest'
import router from '@/router'

describe('router/index.ts', () => {
  it('erstellt einen Router mit definierten Routen', () => {
    const routes = router.getRoutes()

    const paths = routes.map(r => r.path)

    expect(paths).toContain('/')
    expect(paths).toContain('/about')
    expect(paths).toContain('/exercises')
    expect(paths).toContain('/workout-start')
    expect(paths).toContain('/workouts/:id/sets')
    expect(paths).toContain('/workout-history')
  })
})

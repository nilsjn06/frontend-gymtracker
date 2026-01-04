import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/exercises',
      name: 'exercises',
      component: () => import('../views/ExercisesView.vue'),
    },
    {
      path: '/workout-start',
      name: 'workout-start',
      component: () => import('../views/WorkoutStart.vue'),
    },
    {
      path: '/workouts/:id/sets',
      name: 'workout-sets',
      component: () => import('../views/WorkoutSets.vue'),
    },
    {
      path: '/workout-history',
      name: 'workout-history',
      component: () => import('../views/WorkoutHistory.vue'),
    },
  ],
})

export default router

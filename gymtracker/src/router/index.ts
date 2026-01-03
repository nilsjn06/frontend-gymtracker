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
      path: '/workouts',
      name: 'workouts',
      component: () => import('../views/WorkoutsView.vue'),
    },
    {
      path: '/workouts/:id',
      name: 'workout-detail',
      component: () => import('../views/WorkoutDetailView.vue'),
      props: true,
    },
    {
      path: '/exercises',
      name: 'exercises',
      component: () => import('../views/ExercisesView.vue'),
    },
  ],
})

export default router

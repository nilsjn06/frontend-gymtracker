<template>
  <!-- Reusable edit (pencil) icon component using bootstrap-icons CSS. -->
  <i :class="['bi', 'bi-pencil', customClass]" aria-hidden="true"></i>
  <span v-if="label" class="visually-hidden">{{ label }}</span>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{ customClass?: string; label?: string }>()
const customClass = props.customClass ?? ''
const label = props.label ?? null
</script>

<style scoped>
/* spacing passed via customClass (e.g. me-1) */
</style>


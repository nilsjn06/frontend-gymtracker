<template>
  <!-- Reusable trash icon component using bootstrap-icons CSS. -->
  <i :class="['bi', 'bi-trash', customClass]" aria-hidden="true"></i>
  <span v-if="label" class="visually-hidden">{{ label }}</span>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{ customClass?: string; label?: string }>()

// provide a nicer prop name inside template
const customClass = props.customClass ?? ''
const label = props.label ?? null
</script>

<style scoped>
/* nothing special here; spacing can be passed via class (e.g. me-1) */
</style>


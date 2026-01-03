<script setup lang="ts">
defineProps<{
  id: number
  name: string
  muskelgruppe: string
}>()
</script>

<template>
  <div class="Uebung">
    <h3>{{ name }}</h3>
    <ul>
      <li><strong>Muskelgruppe:</strong> {{ muskelgruppe }}</li>
    </ul>
  </div>
</template>

<style scoped>
.Uebung {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #000000;
}
</style>

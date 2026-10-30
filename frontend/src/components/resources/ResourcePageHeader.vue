<script setup lang="ts">
import AppIcon from '../AppIcon.vue'

defineProps<{
  eyebrow: string
  title: string
  description: string
  actionLabel: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="products-heading">
    <div>
      <div class="welcome-eyebrow"><span class="live-dot" /> {{ eyebrow }}</div>
      <h1>{{ title }}</h1>
      <p class="welcome-subtitle">{{ description }}</p>
    </div>
    <button class="primary-action" @click="emit('action')"><AppIcon name="plus" :size="16" /> {{ actionLabel }}</button>
  </div>
</template>

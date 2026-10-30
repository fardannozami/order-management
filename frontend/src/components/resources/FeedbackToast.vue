<script setup lang="ts">
import AppIcon from '../AppIcon.vue'

defineProps<{ feedback: { type: 'success' | 'error'; message: string } | null }>()
const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <Transition name="toast">
    <div v-if="feedback" class="products-toast" :class="feedback.type" role="status">
      <AppIcon :name="feedback.type === 'success' ? 'check' : 'warning'" :size="16" />
      {{ feedback.message }}
      <button aria-label="Tutup notifikasi" @click="emit('dismiss')"><AppIcon name="close" :size="14" /></button>
    </div>
  </Transition>
</template>

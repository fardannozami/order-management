<script setup lang="ts">
import AppIcon from '../AppIcon.vue'

defineProps<{
  entityLabel: string
  entityName: string
  pending: boolean
  error: string
  confirmLabel: string
}>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <Transition name="modal-fade">
    <div class="dialog-backdrop" @click.self="emit('close')">
      <section class="product-dialog delete-dialog" :aria-label="`Hapus ${entityLabel}`">
        <div class="delete-icon"><AppIcon name="trash" :size="20" /></div>
        <button class="dialog-close delete-close" aria-label="Tutup" @click="emit('close')"><AppIcon name="close" /></button>
        <h2>Hapus {{ entityLabel }} ini?</h2>
        <p><strong>{{ entityName }}</strong> <slot /> </p>
        <div v-if="error" class="form-server-error" role="alert"><AppIcon name="warning" :size="15" /> {{ error }}</div>
        <div class="dialog-footer">
          <button class="secondary-action" :disabled="pending" @click="emit('close')">Batal</button>
          <button class="delete-confirm" :disabled="pending" @click="emit('confirm')">{{ pending ? 'Menghapus…' : confirmLabel }}</button>
        </div>
      </section>
    </div>
  </Transition>
</template>

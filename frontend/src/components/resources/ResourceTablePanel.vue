<script setup lang="ts">
import AppIcon from '../AppIcon.vue'

const props = withDefaults(defineProps<{
  title: string
  description: string
  search: string
  searchPlaceholder: string
  showSearch?: boolean
  loading: boolean
  error: boolean
  errorTitle: string
  errorMessage: string
  empty: boolean
  emptyTitle: string
  emptyDescription: string
  emptyIcon: string
  itemLabel: string
  total: number
  page: number
  perPage: number
  totalPages: number
}>(), { showSearch: true })

const emit = defineEmits<{
  'update:search': [value: string]
  'update:page': [value: number]
  retry: []
}>()

function updateSearch(event: Event) {
  emit('update:search', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="products-card resource-table-panel">
    <div class="products-toolbar">
      <div><h2>{{ title }}</h2><p>{{ description }}</p></div>
      <label v-if="showSearch" class="product-search">
        <AppIcon name="search" :size="15" />
        <input :value="search" type="search" :placeholder="searchPlaceholder" aria-label="Cari" @input="updateSearch" />
        <kbd>⌘ K</kbd>
      </label>
    </div>

    <div v-if="loading" class="products-state loading-state" aria-live="polite">
      <span class="loading-spinner" /><strong>Memuat data</strong><p>Sedang mengambil data terbaru.</p>
    </div>
    <div v-else-if="error" class="products-state error-state" role="alert">
      <span class="state-icon error"><AppIcon name="warning" :size="20" /></span><strong>{{ errorTitle }}</strong>
      <p>{{ errorMessage }}</p>
      <button class="secondary-action" @click="emit('retry')"><AppIcon name="download" :size="14" /> Coba lagi</button>
    </div>
    <div v-else-if="empty" class="products-state empty-state">
      <span class="state-icon"><AppIcon :name="emptyIcon" :size="21" /></span><strong>{{ emptyTitle }}</strong>
      <p>{{ emptyDescription }}</p>
      <slot name="empty-action" />
    </div>
    <div v-else class="table-scroll resource-table-scroll"><slot name="table" /></div>

    <footer v-if="!loading && !error && !empty" class="table-pagination">
      <span>Menampilkan <strong>{{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, total) }}</strong> dari <strong>{{ total }}</strong> {{ itemLabel }}</span>
      <div class="pagination-controls">
        <button :disabled="page <= 1" aria-label="Halaman sebelumnya" @click="emit('update:page', page - 1)"><AppIcon name="chevron" :size="14" class="previous-chevron" /></button>
        <span>Halaman <strong>{{ page }}</strong> dari <strong>{{ totalPages }}</strong></span>
        <button :disabled="page >= totalPages" aria-label="Halaman selanjutnya" @click="emit('update:page', page + 1)"><AppIcon name="chevron" :size="14" /></button>
      </div>
    </footer>
  </div>
</template>

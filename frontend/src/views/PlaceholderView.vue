<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => String(route.meta.title ?? 'Order Management'))
const description = computed(() => String(route.meta.description ?? ''))
</script>

<template>
  <section class="page-content">
    <div class="page-heading">
      <p class="eyebrow">Order Management</p>
      <h1>{{ title }}</h1>
      <p class="page-description">{{ description }}</p>
    </div>
    <div class="setup-card">
      <i class="pi pi-check-circle" />
      <div>
        <h2>Frontend siap dikembangkan</h2>
        <p>Routing, state management, data fetching, dan komponen UI sudah dikonfigurasi.</p>
      </div>
    </div>
  </section>
</template>

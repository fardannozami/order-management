<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'

type Stat = { label: string; value: string | number; suffix?: string; icon: string; tone?: 'purple' | 'red' | 'amber' }

const props = defineProps<{ items: Stat[]; note?: string }>()
const containerClass = computed(() => props.items.length === 1 ? 'customer-stats' : '')
</script>

<template>
  <div class="product-stats" :class="containerClass">
    <div v-for="item in items" :key="item.label">
      <span class="product-stat-icon" :class="item.tone ?? 'purple'"><AppIcon :name="item.icon" :size="16" /></span>
      <span><small>{{ item.label }}</small><strong>{{ item.value }} <small v-if="item.suffix">{{ item.suffix }}</small></strong></span>
    </div>
    <div v-if="note" class="product-stat-note"><AppIcon name="check" :size="15" /> {{ note }}</div>
  </div>
</template>

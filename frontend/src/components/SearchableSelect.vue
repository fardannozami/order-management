<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, withDefaults } from 'vue'
import AppIcon from './AppIcon.vue'

interface SelectOption {
  id: string | number
  label: string
  note?: string
  disabled?: boolean
}

interface SearchableSelectProps {
  modelValue: string | number
  options: SelectOption[]
  fieldLabel: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
  emptyMessage?: string
}

const props = withDefaults(defineProps<SearchableSelectProps>(), {
  placeholder: 'Pilih',
  required: true,
  disabled: false,
  loading: false,
  emptyMessage: 'Tidak ada pilihan yang cocok',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const search = ref('')
const open = ref(false)
const activeIndex = ref(-1)
const wrapperRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const labelId = useId()
const listId = useId()

let closeTimer: ReturnType<typeof setTimeout> | null = null

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return props.options
  return props.options.filter((option) => option.label.toLowerCase().includes(query))
})

const selectedOption = computed(() => props.options.find((option) => option.id === props.modelValue))

function openList() {
  if (props.disabled || props.loading || open.value) return
  open.value = true
  activeIndex.value = filtered.value.length ? 0 : -1
  inputRef.value?.focus()
}

function closeList() {
  open.value = false
  activeIndex.value = -1
}

function toggleList() {
  if (open.value) closeList()
  else openList()
}

function moveActive(step: number) {
  const options = filtered.value
  if (!options.length) return
  let next = activeIndex.value + step
  if (next < 0) next = 0
  if (next >= options.length) next = options.length - 1
  activeIndex.value = next
}

function commitActive() {
  const option = filtered.value[activeIndex.value]
  if (!option || option.disabled) return
  select(option)
}

function select(option: SelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.id)
  search.value = ''
  closeList()
  inputRef.value?.focus()
}

function clearSearch() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  search.value = ''
  activeIndex.value = filtered.value.length ? 0 : -1
  inputRef.value?.focus()
}

function onInputKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!open.value) openList()
      else moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!open.value) {
        openList()
        activeIndex.value = filtered.value.length - 1
      } else moveActive(-1)
      break
    case 'Enter':
      if (open.value) {
        event.preventDefault()
        commitActive()
      } else toggleList()
      break
    case 'Escape':
      closeList()
      break
    case 'Home':
    case 'End':
      if (open.value) {
        event.preventDefault()
        activeIndex.value = event.key === 'Home' ? 0 : filtered.value.length - 1
      }
      break
  }
}

function onOptionKeydown(event: KeyboardEvent, index: number) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      select(filtered.value[index])
      break
    case 'ArrowDown':
      event.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActive(-1)
      break
    case 'Escape':
      closeList()
      inputRef.value?.focus()
      break
    case 'Home':
    case 'End':
      event.preventDefault()
      activeIndex.value = event.key === 'Home' ? 0 : filtered.value.length - 1
      break
  }
}

function onOptionMousedown(_event: MouseEvent, option: SelectOption) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  select(option)
  inputRef.value?.focus()
}

function onInputBlur() {
  closeTimer = setTimeout(closeList, 120)
}

function onDocumentMouseDown(event: MouseEvent) {
  if (open.value && wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    closeList()
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentMouseDown))
onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
  document.removeEventListener('mousedown', onDocumentMouseDown)
})
</script>

<template>
  <label class="form-field searchable-field">
    <span :id="labelId">{{ fieldLabel }} <b aria-hidden="true">*</b></span>
    <div class="searchable-wrap" ref="wrapperRef">
      <div class="searchable-control">
        <input
          ref="inputRef"
          type="search"
          role="combobox"
          :aria-labelledby="labelId"
          :aria-expanded="open"
          :aria-controls="open ? listId : undefined"
          :aria-activedescendant="activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined"
          :aria-required="required"
          v-model="search"
          :placeholder="selectedOption?.label || placeholder"
          :disabled="disabled || loading"
          @click.self="toggleList"
          @keydown="onInputKeydown"
          @blur="onInputBlur"
        />
        <div class="searchable-control__icon">
          <AppIcon name="search" :size="10" aria-hidden="true" />
        </div>
        <button
          v-if="search"
          type="button"
          class="searchable-clear"
          title="Hapus pencarian"
          aria-label="Hapus pencarian"
          @click="clearSearch"
        >
          ×
        </button>
      </div>
      <div
        v-if="open"
        role="listbox"
        :id="listId"
        :aria-label="`${fieldLabel} pilihan`"
        class="searchable-list"
        @mousedown.prevent
      >
        <div
          v-if="filtered.length === 0"
          role="option"
          aria-disabled="true"
          class="searchable-option searchable-option--empty"
        >
          {{ emptyMessage }}
        </div>
        <div
          v-else
          v-for="(option, index) in filtered"
          :key="option.id"
          role="option"
          :id="`${listId}-${index}`"
          :aria-selected="option.id === modelValue ? 'true' : 'false'"
          :aria-disabled="option.disabled ? 'true' : 'false'"
          :class="[
            'searchable-option',
            { 'searchable-option--active': activeIndex === index, 'searchable-option--disabled': option.disabled },
          ]"
          :tabindex="activeIndex === index ? 0 : -1"
          @mousedown="onOptionMousedown($event, option)"
          @keydown="(event) => onOptionKeydown(event, index)"
        >
          {{ option.label }}
          <small v-if="option.note">{{ option.note }}</small>
        </div>
      </div>
      <small v-if="error" class="field-error">{{ error }}</small>
    </div>
  </label>
</template>

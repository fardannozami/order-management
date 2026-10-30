import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

const storageKey = 'order-management-theme'

function readSavedMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readSavedMode())
  const systemPrefersDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
  const resolvedMode = computed(() => mode.value === 'system'
    ? (systemPrefersDark.value ? 'dark' : 'light')
    : mode.value)

  function applyTheme() {
    document.documentElement.dataset.theme = resolvedMode.value
    document.documentElement.style.colorScheme = resolvedMode.value
  }

  function setMode(nextMode: ThemeMode) {
    mode.value = nextMode
  }

  watch(mode, (nextMode) => {
    try {
      localStorage.setItem(storageKey, nextMode)
    } catch {
      // Keep the selected mode for the current session when storage is unavailable.
    }
    applyTheme()
  }, { immediate: true })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    systemPrefersDark.value = event.matches
    if (mode.value === 'system') applyTheme()
  })

  return { mode, resolvedMode, setMode }
})

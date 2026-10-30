<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppIcon from './components/AppIcon.vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore, type ThemeMode } from './stores/theme'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()
const pageTitle = computed(() => String(route.meta.title ?? 'Dashboard'))
const profileInitials = computed(() => (auth.user?.name ?? 'AD').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase())

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: 'grid' },
  { label: 'Produk', to: '/products', icon: 'box' },
  { label: 'Pelanggan', to: '/customers', icon: 'users' },
  { label: 'Order', to: '/orders', icon: 'cart' },
]
const modes: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Terang', icon: 'sun' },
  { value: 'dark', label: 'Gelap', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'monitor' },
]

async function logout() {
  try { await auth.logout() } catch { /* local session is cleared even if the API is offline */ }
  await router.replace('/login')
}
</script>

<template>
  <section v-if="route.name === 'login'" class="login-layout"><RouterView /></section>
  <section v-else-if="route.name === 'landing'" class="landing-layout"><RouterView /></section>
  <div v-else class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/dashboard" aria-label="Orderly, ke dashboard">
        <span class="brand-mark"><AppIcon name="box" :size="20" /></span>
        <span class="brand-copy"><strong>orderly</strong><small>ORDER MANAGEMENT</small></span>
      </RouterLink>

      <div class="workspace-label">WORKSPACE</div>
      <nav class="navigation" aria-label="Navigasi utama">
        <RouterLink v-for="item in navigation" :key="item.to" class="navigation-link" :to="item.to">
          <AppIcon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
          <span v-if="item.to === '/orders'" class="nav-count">12</span>
        </RouterLink>
      </nav>

      <div class="sidebar-bottom">
        <div class="help-card">
          <div class="help-icon"><AppIcon name="chart" :size="17" /></div>
          <strong>Butuh bantuan?</strong>
          <p>Lihat dokumentasi API dan panduan penggunaan.</p>
          <a href="http://localhost:3000/" target="_blank" rel="noreferrer">Buka dokumentasi <AppIcon name="arrow" :size="13" /></a>
        </div>
        <div class="profile-mini">
          <div class="avatar">{{ profileInitials }}</div>
          <div class="profile-copy"><strong>{{ auth.user?.name ?? 'Admin' }}</strong><span>{{ auth.user?.email ?? 'Akun aktif' }}</span></div>
          <button class="icon-button profile-menu" aria-label="Keluar" title="Keluar" @click="logout"><AppIcon name="logout" :size="16" /></button>
        </div>
      </div>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="breadcrumbs"><span>Workspace</span><AppIcon name="chevron" :size="14" /><strong>{{ pageTitle }}</strong></div>
        <div class="topbar-actions">
          <label class="search-box">
            <AppIcon name="search" :size="16" />
            <input type="search" placeholder="Cari sesuatu..." aria-label="Cari" />
            <kbd>⌘ K</kbd>
          </label>
          <div class="theme-switch" role="group" aria-label="Mode tampilan">
            <button v-for="mode in modes" :key="mode.value" class="theme-option" :class="{ selected: theme.mode === mode.value }" :aria-label="mode.label" :aria-pressed="theme.mode === mode.value" :title="mode.label" @click="theme.setMode(mode.value)">
              <AppIcon :name="mode.icon" :size="15" />
            </button>
          </div>
          <button class="icon-button notification-button" aria-label="Notifikasi">
            <AppIcon name="bell" :size="18" /><span class="notification-dot" />
          </button>
          <div class="topbar-avatar" :aria-label="`Profil ${auth.user?.name ?? 'Admin'}`">{{ profileInitials }}</div>
        </div>
      </header>
      <RouterView />
    </main>
  </div>
</template>

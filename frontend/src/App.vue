<script setup lang="ts">
import Button from 'primevue/button'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: 'pi pi-chart-bar' },
  { label: 'Produk', to: '/products', icon: 'pi pi-box' },
  { label: 'Pelanggan', to: '/customers', icon: 'pi pi-users' },
  { label: 'Order', to: '/orders', icon: 'pi pi-shopping-cart' },
]
</script>

<template>
  <div v-if="route.name === 'login'" class="login-layout">
    <RouterView />
  </div>
  <div v-else class="app-layout">
    <aside class="sidebar">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark"><i class="pi pi-box" /></span>
        <span>Order Management</span>
      </RouterLink>

      <nav class="navigation" aria-label="Navigasi utama">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          class="navigation-link"
          :to="item.to"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <Button label="Dokumentasi API" icon="pi pi-external-link" text as="a" href="http://localhost:3000/" target="_blank" />
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <span class="topbar-label">Sistem Manajemen Order</span>
      </header>
      <RouterView />
    </main>
  </div>
</template>

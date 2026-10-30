<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()
const title = computed(() => String(route.meta.title ?? 'Order Management'))
const description = computed(() => String(route.meta.description ?? ''))
</script>

<template>
  <section v-if="route.name === 'login'" class="login-page">
    <div class="login-art">
      <RouterLink class="login-brand" to="/dashboard"><span class="brand-mark"><AppIcon name="box" :size="20" /></span><strong>orderly</strong></RouterLink>
      <div class="login-art-copy">
        <span class="login-kicker">ORDER MANAGEMENT, SIMPLIFIED</span>
        <h1>Semua order,<br />dalam kendali.</h1>
        <p>Kelola produk, pelanggan, dan transaksi tokomu dalam satu tempat.</p>
      </div>
      <div class="login-art-foot"><span class="live-dot" /> Sistem manajemen order yang rapi dan efisien</div>
      <div class="login-decoration decoration-one" /><div class="login-decoration decoration-two" />
    </div>
    <div class="login-form-area">
      <form class="login-form" @submit.prevent>
        <span class="demo-label">PREVIEW UI · BELUM TERHUBUNG KE API</span>
        <h2>Selamat datang</h2>
        <p>Masuk menggunakan akun yang sudah terdaftar.</p>
        <label for="email">Email</label>
        <input id="email" type="email" placeholder="nama@perusahaan.com" autocomplete="username" />
        <div class="password-label"><label for="password">Password</label><a href="#forgot">Lupa password?</a></div>
        <input id="password" type="password" placeholder="Masukkan password" autocomplete="current-password" />
        <button class="primary-action login-submit" type="submit">Masuk ke dashboard <AppIcon name="arrow" :size="15" /></button>
        <div class="login-separator"><span />Akun demo<span /></div>
        <div class="demo-account"><strong>admin@azatech.id</strong><span>Password demo tersedia di README backend.</span></div>
      </form>
      <span class="login-copyright">© 2026 Orderly · Azatech</span>
    </div>
  </section>

  <section v-else class="page-content placeholder-page">
    <div class="welcome-eyebrow"><span class="live-dot" /> WORKSPACE <span class="demo-label">UI PREVIEW</span></div>
    <h1>{{ title }}</h1>
    <p class="welcome-subtitle">{{ description }}</p>
    <div class="setup-card">
      <span class="placeholder-icon"><AppIcon name="check" :size="18" /></span>
      <div>
        <h2>Tampilan {{ title.toLowerCase() }} siap dikembangkan</h2>
        <p>Kerangka visual sudah tersedia. Tabel, form, pagination, dan aksi akan dihubungkan ke API pada tahap implementasi fitur.</p>
      </div>
    </div>
    <RouterLink class="primary-action placeholder-action" to="/dashboard">Kembali ke dashboard <AppIcon name="arrow" :size="14" /></RouterLink>
  </section>
</template>

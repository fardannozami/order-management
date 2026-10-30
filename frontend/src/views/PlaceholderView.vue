<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { ApiRequestError, useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const title = computed(() => String(route.meta.title ?? 'Order Management'))
const description = computed(() => String(route.meta.description ?? ''))
const email = ref('')
const password = ref('')
const submitting = ref(false)
const loginError = ref('')

function fillDemoCredentials() {
  email.value = 'admin@azatech.id'
  password.value = 'ChangeMe123!'
  loginError.value = ''
}

async function submitLogin() {
  if (submitting.value) return
  submitting.value = true
  loginError.value = ''
  try {
    await auth.login(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    loginError.value = error instanceof ApiRequestError
      ? error.message
      : 'Login gagal. Periksa koneksi lalu coba lagi.'
  } finally {
    submitting.value = false
  }
}
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
      <form class="login-form" @submit.prevent="submitLogin">
        <span class="demo-label">AKSES AMAN · ORDER MANAGEMENT</span>
        <h2>Selamat datang</h2>
        <p>Masuk menggunakan akun yang sudah terdaftar.</p>
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" placeholder="nama@perusahaan.com" autocomplete="username" required />
        <div class="password-label"><label for="password">Password</label><a href="#forgot">Lupa password?</a></div>
        <input id="password" v-model="password" type="password" placeholder="Masukkan password" autocomplete="current-password" required />
        <p v-if="loginError" class="login-error" role="alert">{{ loginError }}</p>
        <button class="primary-action login-submit" type="submit" :disabled="submitting">
          {{ submitting ? 'Sedang masuk…' : 'Masuk ke dashboard' }} <AppIcon name="arrow" :size="15" />
        </button>
        <div class="login-separator"><span />atau gunakan akun demo<span /></div>
        <button class="demo-button" type="button" @click="fillDemoCredentials"><AppIcon name="users" :size="15" /> Isi akun demo</button>
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

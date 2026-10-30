<script setup lang="ts">
import AppIcon from '../components/AppIcon.vue'
import { useThemeStore, type ThemeMode } from '../stores/theme'

const theme = useThemeStore()
const modes: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Terang', icon: 'sun' },
  { value: 'dark', label: 'Gelap', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'monitor' },
]

const features = [
  { icon: 'box', tone: 'purple', title: 'Kelola produk', description: 'Pantau katalog, harga, dan stok produk dari satu tempat.' },
  { icon: 'users', tone: 'mint', title: 'Data pelanggan', description: 'Simpan informasi pelanggan agar transaksi lebih tertata.' },
  { icon: 'cart', tone: 'peach', title: 'Proses order', description: 'Buat transaksi multi-produk dengan perhitungan otomatis.' },
  { icon: 'chart', tone: 'blue', title: 'Pantau performa', description: 'Lihat ringkasan penjualan, produk terlaris, dan stok menipis.' },
]
</script>

<template>
  <div class="landing-page">
    <header class="landing-nav">
      <RouterLink class="brand" to="/" aria-label="Orderly, beranda">
        <span class="brand-mark"><AppIcon name="box" :size="20" /></span>
        <span class="brand-copy"><strong>orderly</strong><small>ORDER MANAGEMENT</small></span>
      </RouterLink>

      <nav class="landing-links" aria-label="Navigasi landing page">
        <a href="#fitur">Fitur</a>
        <a href="#alur">Cara kerja</a>
        <a href="http://localhost:3000/" target="_blank" rel="noreferrer">Dokumentasi API <AppIcon name="arrow" :size="12" /></a>
      </nav>

      <div class="landing-actions">
        <div class="theme-switch" role="group" aria-label="Mode tampilan">
          <button v-for="mode in modes" :key="mode.value" class="theme-option" :class="{ selected: theme.mode === mode.value }" :aria-label="mode.label" :aria-pressed="theme.mode === mode.value" :title="mode.label" @click="theme.setMode(mode.value)">
            <AppIcon :name="mode.icon" :size="15" />
          </button>
        </div>
        <RouterLink class="landing-login" to="/login">Masuk</RouterLink>
        <RouterLink class="landing-cta" to="/login">Mulai sekarang <AppIcon name="arrow" :size="14" /></RouterLink>
      </div>
    </header>

    <main>
      <section class="landing-hero">
        <div class="hero-copy">
          <span class="hero-badge"><span class="live-dot" /> SISTEM ORDER MANAGEMENT</span>
          <h1>Operasional toko<br />jadi <span>lebih tertata.</span></h1>
          <p class="hero-description">Kelola produk, pelanggan, dan transaksi dalam satu alur yang sederhana. Fokus pada bisnis, biar orderly bantu urus detailnya.</p>
          <div class="hero-actions">
            <RouterLink class="hero-primary" to="/login">Masuk ke dashboard <AppIcon name="arrow" :size="16" /></RouterLink>
            <a class="hero-secondary" href="#fitur"><span class="play-mark">↓</span> Jelajahi fitur</a>
          </div>
          <div class="hero-proof">
            <div class="proof-avatars"><span>AD</span><span>SA</span><span>AW</span><span>+12</span></div>
            <p><strong>Dibuat untuk operasional harian</strong><br /><span>Produk · Pelanggan · Transaksi</span></p>
          </div>
        </div>

        <div class="hero-visual" aria-label="Ilustrasi dashboard order management">
          <div class="visual-glow" />
          <div class="float-chip chip-sales"><span class="float-icon sales"><AppIcon name="chart" :size="16" /></span><span><small>Total penjualan</small><strong>Rp 48,3 jt</strong></span><i>+8,2%</i></div>
          <div class="dashboard-mock">
            <div class="mock-topbar"><div class="mock-brand"><span class="mock-brand-icon"><AppIcon name="box" :size="12" /></span><b>orderly</b></div><span class="mock-date">Ringkasan bisnis <AppIcon name="chevron" :size="10" /></span><span class="mock-avatar">AD</span></div>
            <div class="mock-content">
              <div class="mock-title"><span><b>Dashboard</b><small>Selamat pagi, Admin</small></span><span class="mock-button"><AppIcon name="plus" :size="11" /> Buat order</span></div>
              <div class="mock-metrics"><div><small>Total transaksi</small><b>1.284</b><i class="mock-green">↗ 12,8%</i></div><div><small>Total penjualan</small><b>Rp 48,3 jt</b><i class="mock-blue">Bulan ini</i></div></div>
              <div class="mock-chart-card"><div class="mock-card-heading"><b>Tren penjualan</b><small>7 hari terakhir⌄</small></div><div class="mock-chart"><div class="mock-chart-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 420 105" preserveAspectRatio="none"><defs><linearGradient id="landingChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#786de1" stop-opacity=".25" /><stop offset="1" stop-color="#786de1" stop-opacity="0" /></linearGradient></defs><path class="mock-area" d="M0 83 C34 76 37 48 74 55 S112 83 148 58 S185 39 220 49 S263 23 296 34 S332 52 366 20 S399 29 420 8 L420 105 L0 105Z" /><path class="mock-line" d="M0 83 C34 76 37 48 74 55 S112 83 148 58 S185 39 220 49 S263 23 296 34 S332 52 366 20 S399 29 420 8" /></svg></div><div class="mock-week"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div></div>
              <div class="mock-bottom"><div class="mock-bottom-title"><b>Produk terlaris</b><small>Lihat semua</small></div><div class="mock-product"><span class="mock-product-icon aqua">H</span><span><b>Hydrococo 150ml</b><small>P0001</small></span><strong>324 <small>unit</small></strong></div><div class="mock-product"><span class="mock-product-icon blue">A</span><span><b>Air Mineral 600ml</b><small>P0002</small></span><strong>286 <small>unit</small></strong></div></div>
            </div>
          </div>
          <div class="float-chip chip-stock"><span class="stock-pulse"><AppIcon name="warning" :size="15" /></span><span><small>Perlu perhatian</small><strong>3 stok menipis</strong></span></div>
          <div class="visual-orbit orbit-a" /><div class="visual-orbit orbit-b" />
        </div>
        <div class="hero-bottom-note"><span>DIRANCANG UNTUK BISNIS YANG INGIN TUMBUH</span><span class="note-rule" /><span>RINGKAS · JELAS · TERKENDALI</span></div>
      </section>

      <section id="fitur" class="features-section">
        <div class="section-heading"><span class="section-kicker">SEMUA YANG DIBUTUHKAN</span><h2>Kelola bisnis dari<br /><span>satu dashboard.</span></h2><p>Alur kerja penting tersedia dalam satu aplikasi yang mudah dipahami tim.</p></div>
        <div class="features-grid">
          <article v-for="(feature, index) in features" :key="feature.title" class="feature-card">
            <div class="feature-topline"><span class="feature-icon" :class="feature.tone"><AppIcon :name="feature.icon" :size="19" /></span><span class="feature-index">0{{ index + 1 }}</span></div>
            <h3>{{ feature.title }}</h3><p>{{ feature.description }}</p>
            <a href="#alur">Pelajari lebih lanjut <AppIcon name="arrow" :size="13" /></a>
          </article>
        </div>
      </section>

      <section id="alur" class="workflow-section">
        <div class="workflow-copy"><span class="section-kicker">ALUR KERJA YANG SEDERHANA</span><h2>Dari katalog<br />hingga transaksi.</h2><p>Data produk dan pelanggan terhubung ke proses order. Harga dan stok dihitung otomatis saat transaksi dibuat.</p><RouterLink class="workflow-link" to="/login">Mulai kelola order <AppIcon name="arrow" :size="14" /></RouterLink></div>
        <div class="workflow-steps">
          <div class="workflow-step"><span class="step-number">01</span><span class="step-icon lavender"><AppIcon name="box" :size="19" /></span><div><h3>Siapkan katalog</h3><p>Kelola produk, harga, dan ketersediaan stok.</p></div></div>
          <div class="step-connector" />
          <div class="workflow-step"><span class="step-number">02</span><span class="step-icon mint"><AppIcon name="users" :size="19" /></span><div><h3>Pilih pelanggan</h3><p>Simpan profil pelanggan dan temukan saat dibutuhkan.</p></div></div>
          <div class="step-connector" />
          <div class="workflow-step"><span class="step-number">03</span><span class="step-icon peach"><AppIcon name="cart" :size="19" /></span><div><h3>Buat transaksi</h3><p>Tambahkan beberapa produk, lalu cek total order.</p></div></div>
        </div>
      </section>
    </main>

    <footer class="landing-footer"><RouterLink class="brand" to="/"><span class="brand-mark"><AppIcon name="box" :size="17" /></span><span class="brand-copy"><strong>orderly</strong><small>ORDER MANAGEMENT</small></span></RouterLink><span>© 2026 Orderly · Dibuat untuk operasional yang lebih tertata.</span><a href="http://localhost:3000/" target="_blank" rel="noreferrer">Dokumentasi API <AppIcon name="arrow" :size="12" /></a></footer>
  </div>
</template>

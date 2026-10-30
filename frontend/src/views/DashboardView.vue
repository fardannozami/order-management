<script setup lang="ts">
import AppIcon from '../components/AppIcon.vue'

const summary = [
  { label: 'Total transaksi', value: '1.284', change: '+12,8%', icon: 'cart', color: 'violet', note: 'dibanding bulan lalu' },
  { label: 'Total penjualan', value: 'Rp 48.320.000', change: '+8,2%', icon: 'chart', color: 'blue', note: 'dibanding bulan lalu' },
]

const bestSellers = [
  { rank: '01', code: 'P0001', name: 'Hydrococo 150ml', sold: 324, revenue: 'Rp 3.888.000', tone: 'aqua', initials: 'H' },
  { rank: '02', code: 'P0002', name: 'Air Mineral 600ml', sold: 286, revenue: 'Rp 1.430.000', tone: 'blue', initials: 'A' },
  { rank: '03', code: 'P0003', name: 'Teh Botol 350ml', sold: 241, revenue: 'Rp 1.687.000', tone: 'amber', initials: 'T' },
  { rank: '04', code: 'P0005', name: 'Kopi Susu 250ml', sold: 198, revenue: 'Rp 2.970.000', tone: 'brown', initials: 'K' },
  { rank: '05', code: 'P0004', name: 'Roti Cokelat', sold: 172, revenue: 'Rp 1.462.000', tone: 'rose', initials: 'R' },
]

const lowStock = [
  { name: 'Susu UHT 250ml', code: 'P0006', stock: 2, tone: 'critical' },
  { name: 'Roti Keju', code: 'P0014', stock: 3, tone: 'warning' },
  { name: 'Keripik Kentang', code: 'P0008', stock: 4, tone: 'warning' },
]

const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const dateLabel = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
</script>

<template>
  <section class="dashboard page-content">
    <div class="welcome-row">
      <div>
        <div class="welcome-eyebrow"><span class="live-dot" /> Ringkasan bisnis <span class="demo-label">DATA DEMO</span></div>
        <h1>Selamat pagi, Admin <span class="wave">✦</span></h1>
        <p class="welcome-subtitle">Berikut yang terjadi di tokomu hari ini.</p>
      </div>
      <div class="welcome-actions">
        <div class="date-chip"><AppIcon name="calendar" :size="15" /> {{ dateLabel }}</div>
        <RouterLink class="primary-action" to="/orders"><AppIcon name="plus" :size="17" /> Buat order</RouterLink>
      </div>
    </div>

    <div class="summary-grid">
      <article v-for="item in summary" :key="item.label" class="summary-card">
        <div class="summary-card-top">
          <span class="summary-label">{{ item.label }}</span>
          <span class="summary-icon" :class="item.color"><AppIcon :name="item.icon" :size="18" /></span>
        </div>
        <div class="summary-value">{{ item.value }}</div>
        <div class="summary-foot"><span class="trend-up"><AppIcon name="arrow" :size="12" /> {{ item.change }}</span><span>{{ item.note }}</span></div>
        <div class="card-sparkline" :class="item.color"><svg viewBox="0 0 120 32" preserveAspectRatio="none"><path d="M1 25 C12 23 14 19 24 21 S39 13 49 18 S65 11 74 14 S88 6 97 10 S110 5 119 2" /></svg></div>
      </article>

      <article class="summary-card compact-stat">
        <div class="summary-card-top"><span class="summary-label">Produk aktif</span><span class="summary-icon mint"><AppIcon name="box" :size="18" /></span></div>
        <div class="summary-value">20 <small>produk</small></div>
        <div class="summary-foot"><span class="neutral-pill">Semua kategori</span><span>di katalog</span></div>
        <div class="mini-category-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
      </article>

      <article class="summary-card compact-stat">
        <div class="summary-card-top"><span class="summary-label">Pelanggan</span><span class="summary-icon peach"><AppIcon name="users" :size="18" /></span></div>
        <div class="summary-value">15 <small>pelanggan</small></div>
        <div class="summary-foot"><span class="neutral-pill">Terdaftar</span><span>di database</span></div>
        <div class="customer-dots"><i v-for="dot in 12" :key="dot" :class="`dot-${dot % 4}`" /></div>
      </article>
    </div>

    <div class="dashboard-grid">
      <article class="panel sales-panel">
        <div class="panel-heading">
          <div><h2>Tren penjualan</h2><p>Performa penjualan selama 7 hari terakhir</p></div>
          <button class="select-period">7 hari terakhir <AppIcon name="chevron" :size="14" /></button>
        </div>
        <div class="chart-summary"><strong>Rp 12.840.000</strong><span class="trend-up"><AppIcon name="arrow" :size="12" /> 8,2%</span><small>vs. minggu lalu</small></div>
        <div class="chart-wrap" role="img" aria-label="Grafik penjualan tujuh hari terakhir">
          <div class="chart-y-labels"><span>Rp 4 jt</span><span>Rp 3 jt</span><span>Rp 2 jt</span><span>Rp 1 jt</span><span>Rp 0</span></div>
          <div class="chart-area">
            <div class="chart-gridlines"><i v-for="line in 5" :key="line" /></div>
            <svg class="sales-chart" viewBox="0 0 700 190" preserveAspectRatio="none">
              <defs><linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7467e8" stop-opacity=".22" /><stop offset="100%" stop-color="#7467e8" stop-opacity="0" /></linearGradient></defs>
              <path class="chart-fill" d="M0 148 C42 140 58 100 100 112 S164 149 200 117 S260 89 300 103 S360 65 400 83 S460 112 500 72 S560 98 600 55 S660 47 700 24 L700 190 L0 190 Z" />
              <path class="chart-line" d="M0 148 C42 140 58 100 100 112 S164 149 200 117 S260 89 300 103 S360 65 400 83 S460 112 500 72 S560 98 600 55 S660 47 700 24" />
              <circle cx="400" cy="83" r="5" class="chart-point" />
            </svg>
            <div class="chart-x-labels"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
          </div>
        </div>
      </article>

      <article class="panel stock-panel">
        <div class="panel-heading">
          <div><h2>Stok menipis <span class="count-badge">{{ lowStock.length }}</span></h2><p>Produk dengan stok di bawah 5</p></div>
          <RouterLink class="text-link" to="/products">Lihat semua <AppIcon name="arrow" :size="13" /></RouterLink>
        </div>
        <div class="stock-list">
          <div v-for="product in lowStock" :key="product.code" class="stock-row">
            <div class="stock-alert-icon" :class="product.tone"><AppIcon name="warning" :size="17" /></div>
            <div class="stock-product"><strong>{{ product.name }}</strong><span>{{ product.code }}</span></div>
            <div class="stock-level" :class="product.tone"><strong>{{ product.stock }}</strong><span>tersisa</span></div>
          </div>
        </div>
        <RouterLink class="stock-footer-link" to="/products">Kelola inventaris <AppIcon name="chevron" :size="14" /></RouterLink>
      </article>

      <article class="panel products-panel">
        <div class="panel-heading">
          <div><h2>Produk terlaris</h2><p>Produk dengan jumlah penjualan tertinggi</p></div>
          <RouterLink class="text-link" to="/products">Lihat produk <AppIcon name="arrow" :size="13" /></RouterLink>
        </div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>PRODUK</th><th>TERJUAL</th><th>PENDAPATAN</th><th>PERINGKAT</th></tr></thead>
            <tbody>
              <tr v-for="product in bestSellers" :key="product.code">
                <td><div class="product-cell"><span class="product-thumb" :class="product.tone">{{ product.initials }}</span><span><strong>{{ product.name }}</strong><small>{{ product.code }}</small></span></div></td>
                <td><strong class="sold-count">{{ product.sold }}</strong><small class="sold-unit">unit</small></td>
                <td class="revenue-cell">{{ product.revenue }}</td>
                <td><span class="rank-badge">{{ product.rank }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <RouterLink class="products-footer-link" to="/products">Lihat laporan produk <AppIcon name="arrow" :size="13" /></RouterLink>
      </article>

      <article class="panel insight-panel">
        <div class="insight-orbit orbit-one" /><div class="insight-orbit orbit-two" />
        <div class="insight-content">
          <span class="insight-tag"><AppIcon name="chart" :size="13" /> INSIGHT MINGGU INI</span>
          <h2>Penjualan tumbuh stabil.</h2>
          <p>Hydrococo menjadi produk paling diminati dengan 324 unit terjual minggu ini.</p>
          <RouterLink to="/orders">Jelajahi transaksi <AppIcon name="arrow" :size="13" /></RouterLink>
        </div>
        <div class="insight-graphic"><span>+8.2<small>%</small></span><i>pertumbuhan</i></div>
      </article>
    </div>
    <p class="dashboard-footnote">Data contoh untuk pratinjau tampilan. Angka akan terhubung ke API setelah integrasi.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import AppIcon from '../components/AppIcon.vue'
import { apiRequest } from '../lib/api'
import { useAuthStore } from '../stores/auth'

type DashboardSummary = {
  total_transactions: number
  total_sales: string
  active_products: number
  active_customers: number
  top_products: { id: number; product_code: string; product_name: string; quantity_sold: number; revenue: string }[]
  low_stock_products: { id: number; product_code: string; product_name: string; stock: number }[]
  sales_trend: { date: string; total_sales: string }[]
  current_week_sales: string
  sales_change_percent: number | null
}

const auth = useAuthStore()
const dashboardQuery = useQuery({
  queryKey: ['dashboard', 'summary'],
  queryFn: () => apiRequest<DashboardSummary>('/dashboard/summary'),
  refetchOnMount: 'always',
})
const dashboard = computed(() => dashboardQuery.data.value)
const userName = computed(() => auth.user?.name?.trim().split(/\s+/)[0] || 'Admin')
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'
})
const dateLabel = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
const numberFormat = new Intl.NumberFormat('id-ID')
const moneyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const stats = computed(() => [
  { label: 'Total transaksi', value: dashboard.value ? numberFormat.format(dashboard.value.total_transactions) : '—', icon: 'cart', color: 'violet', note: 'semua transaksi' },
  { label: 'Total penjualan', value: dashboard.value ? moneyFormat.format(Number(dashboard.value.total_sales)) : '—', icon: 'chart', color: 'blue', note: 'akumulasi penjualan' },
  { label: 'Produk aktif', value: dashboard.value ? numberFormat.format(dashboard.value.active_products) : '—', icon: 'box', color: 'mint', note: 'di katalog' },
  { label: 'Pelanggan', value: dashboard.value ? numberFormat.format(dashboard.value.active_customers) : '—', icon: 'users', color: 'peach', note: 'terdaftar aktif' },
])
const trend = computed(() => dashboard.value?.sales_trend ?? [])
const trendTotal = computed(() => Number(dashboard.value?.current_week_sales ?? 0))
const trendChange = computed<number | null>(() => dashboard.value?.sales_change_percent ?? null)
const trendLabel = computed(() => trendChange.value === null ? 'Belum ada pembanding' : `${trendChange.value > 0 ? '+' : ''}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(trendChange.value)}%`)
const trendTone = computed(() => trendChange.value === null || trendChange.value >= 0 ? 'trend-up' : 'trend-down')
const chartMax = computed(() => Math.max(1, ...trend.value.map((item) => Number(item.total_sales))))
const chartPoints = computed(() => trend.value.map((item, index) => {
  const x = trend.value.length < 2 ? 350 : index * (700 / (trend.value.length - 1))
  const y = 165 - (Number(item.total_sales) / chartMax.value) * 145
  return `${x.toFixed(1)},${y.toFixed(1)}`
}))
const chartLine = computed(() => chartPoints.value.map((point, index) => `${index ? 'L' : 'M'} ${point}`).join(' '))
const chartArea = computed(() => chartPoints.value.length ? `${chartLine.value} L 700 180 L 0 180 Z` : '')
const chartYLabels = computed(() => [1, 0.75, 0.5, 0.25, 0].map((ratio) => formatCompactMoney(chartMax.value * ratio)))
const weekdays = computed(() => trend.value.map((item) => new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${item.date}T12:00:00+07:00`))))
const highlightedTrendIndex = computed(() => trend.value.reduce((best, item, index, list) => Number(item.total_sales) > Number(list[best]?.total_sales ?? -1) ? index : best, 0))
const lowStock = computed(() => dashboard.value?.low_stock_products ?? [])
const bestSellers = computed(() => dashboard.value?.top_products ?? [])
const insightTitle = computed(() => lowStock.value.length ? `${lowStock.value.length} produk perlu diperiksa.` : 'Stok katalog terjaga.')
const insightMessage = computed(() => lowStock.value.length
  ? `${lowStock.value[0]?.product_name} tersisa ${lowStock.value[0]?.stock} unit. Tinjau stok sebelum membuat order berikutnya.`
  : 'Semua produk aktif memiliki stok minimal 5 unit saat ini.')

function formatCompactMoney(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}
function formatRupiah(value: string | number) { return moneyFormat.format(Number(value)) }
function toneFor(index: number) { return ['aqua', 'blue', 'amber', 'brown', 'rose'][index % 5] }
function retry() { dashboardQuery.refetch() }
</script>

<template>
  <section class="dashboard page-content">
    <div class="welcome-row">
      <div>
        <div class="welcome-eyebrow"><span class="live-dot" /> Ringkasan bisnis</div>
        <h1>{{ greeting }}, {{ userName }} <span class="wave">✦</span></h1>
        <p class="welcome-subtitle">Ringkasan transaksi dan kondisi tokomu.</p>
      </div>
      <div class="welcome-actions">
        <div class="date-chip"><AppIcon name="calendar" :size="15" /> {{ dateLabel }}</div>
        <RouterLink class="primary-action" to="/orders"><AppIcon name="plus" :size="17" /> Buat order</RouterLink>
      </div>
    </div>

    <div v-if="dashboardQuery.isError.value && !dashboard" class="dashboard-load-error" role="alert">
      <span class="state-icon error"><AppIcon name="warning" :size="20" /></span>
      <div><strong>Dashboard belum dapat dimuat</strong><p>{{ dashboardQuery.error.value instanceof Error ? dashboardQuery.error.value.message : 'Terjadi gangguan saat mengambil ringkasan.' }}</p></div>
      <button class="secondary-action" @click="retry"><AppIcon name="download" :size="14" /> Coba lagi</button>
    </div>

    <template v-else>
      <div class="summary-grid">
        <article v-for="(item, index) in stats" :key="item.label" class="summary-card" :class="{ 'compact-stat': index > 1 }">
          <div class="summary-card-top"><span class="summary-label">{{ item.label }}</span><span class="summary-icon" :class="item.color"><AppIcon :name="item.icon" :size="18" /></span></div>
          <div class="summary-value">{{ dashboardQuery.isPending.value ? '…' : item.value }}</div>
          <div class="summary-foot"><span class="neutral-pill">{{ item.note }}</span></div>
          <div v-if="index < 2" class="card-sparkline" :class="item.color"><svg viewBox="0 0 120 32" preserveAspectRatio="none"><path d="M1 25 C12 23 14 19 24 21 S39 13 49 18 S65 11 74 14 S88 6 97 10 S110 5 119 2" /></svg></div>
          <div v-else-if="index === 2" class="mini-category-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div v-else class="customer-dots"><i v-for="dot in 12" :key="dot" :class="`dot-${dot % 4}`" /></div>
        </article>
      </div>

      <div v-if="dashboardQuery.isError.value" class="dashboard-stale-note" role="status">Belum dapat diperbarui. Data yang tampil berasal dari pemuatan sebelumnya.</div>
      <div class="dashboard-grid">
        <article class="panel sales-panel">
          <div class="panel-heading">
            <div><h2>Tren penjualan</h2><p>Penjualan harian selama 7 hari terakhir</p></div>
            <span class="select-period">7 hari terakhir <AppIcon name="chevron" :size="14" /></span>
          </div>
          <div class="chart-summary"><strong>{{ formatRupiah(trendTotal) }}</strong><span :class="trendTone"><AppIcon v-if="trendChange !== null" name="arrow" :size="12" /> {{ trendLabel }}</span><small>vs. 7 hari sebelumnya</small></div>
          <div v-if="dashboardQuery.isPending.value" class="dashboard-panel-loading"><span class="loading-spinner" /> Memuat tren penjualan…</div>
          <div v-else-if="trendTotal === 0" class="dashboard-panel-empty"><AppIcon name="chart" :size="19" />Belum ada penjualan dalam 7 hari terakhir.</div>
          <div v-else class="chart-wrap" role="img" aria-label="Grafik penjualan tujuh hari terakhir">
            <div class="chart-y-labels"><span v-for="(label, index) in chartYLabels" :key="index">{{ label }}</span></div>
            <div class="chart-area">
              <div class="chart-gridlines"><i v-for="line in 5" :key="line" /></div>
              <svg class="sales-chart" viewBox="0 0 700 190" preserveAspectRatio="none">
                <defs><linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7467e8" stop-opacity=".22" /><stop offset="100%" stop-color="#7467e8" stop-opacity="0" /></linearGradient></defs>
                <path v-if="chartPoints.length" class="chart-fill" :d="chartArea" />
                <path v-if="chartPoints.length" class="chart-line" :d="chartLine" />
                <circle v-if="chartPoints.length" :cx="chartPoints[highlightedTrendIndex]?.split(',')[0]" :cy="chartPoints[highlightedTrendIndex]?.split(',')[1]" r="5" class="chart-point" />
              </svg>
              <div class="chart-x-labels"><span v-for="(day, index) in weekdays" :key="trend[index]?.date">{{ day }}</span></div>
            </div>
          </div>
        </article>

        <article class="panel stock-panel">
          <div class="panel-heading">
            <div><h2>Stok menipis <span class="count-badge">{{ dashboardQuery.isPending.value ? '…' : lowStock.length }}</span></h2><p>Produk dengan stok di bawah 5</p></div>
            <RouterLink class="text-link" to="/products">Lihat semua <AppIcon name="arrow" :size="13" /></RouterLink>
          </div>
          <div v-if="dashboardQuery.isPending.value" class="dashboard-panel-loading"><span class="loading-spinner" /> Memuat data stok…</div>
          <div v-else-if="!lowStock.length" class="dashboard-panel-empty"><AppIcon name="check" :size="19" />Tidak ada produk dengan stok kritis.</div>
          <div v-else class="stock-list">
            <div v-for="product in lowStock.slice(0, 5)" :key="product.id" class="stock-row">
              <div class="stock-alert-icon" :class="product.stock < 3 ? 'critical' : 'warning'"><AppIcon name="warning" :size="17" /></div>
              <div class="stock-product"><strong>{{ product.product_name }}</strong><span>{{ product.product_code }}</span></div>
              <div class="stock-level" :class="product.stock < 3 ? 'critical' : 'warning'"><strong>{{ product.stock }}</strong><span>tersisa</span></div>
            </div>
          </div>
          <RouterLink class="stock-footer-link" to="/products">Kelola inventaris <AppIcon name="chevron" :size="14" /></RouterLink>
        </article>

        <article class="panel products-panel">
          <div class="panel-heading"><div><h2>Produk terlaris</h2><p>Peringkat berdasarkan jumlah unit terjual</p></div><RouterLink class="text-link" to="/products">Lihat produk <AppIcon name="arrow" :size="13" /></RouterLink></div>
          <div v-if="dashboardQuery.isPending.value" class="dashboard-panel-loading"><span class="loading-spinner" /> Memuat produk terlaris…</div>
          <div v-else-if="!bestSellers.length" class="dashboard-panel-empty"><AppIcon name="box" :size="19" />Belum ada transaksi produk.</div>
          <div v-else class="table-scroll">
            <table>
              <thead><tr><th>PRODUK</th><th>TERJUAL</th><th>PENDAPATAN</th><th>PERINGKAT</th></tr></thead>
              <tbody>
                <tr v-for="(product, index) in bestSellers" :key="product.id">
                  <td><div class="product-cell"><span class="product-thumb" :class="toneFor(index)">{{ product.product_name.slice(0, 1).toUpperCase() }}</span><span><strong>{{ product.product_name }}</strong><small>{{ product.product_code }}</small></span></div></td>
                  <td><strong class="sold-count">{{ numberFormat.format(product.quantity_sold) }}</strong><small class="sold-unit">unit</small></td>
                  <td class="revenue-cell">{{ formatRupiah(product.revenue) }}</td><td><span class="rank-badge">{{ String(index + 1).padStart(2, '0') }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <RouterLink class="products-footer-link" to="/orders">Lihat riwayat transaksi <AppIcon name="arrow" :size="13" /></RouterLink>
        </article>

        <article class="panel insight-panel">
          <div class="insight-orbit orbit-one" /><div class="insight-orbit orbit-two" />
          <div class="insight-content">
            <span class="insight-tag"><AppIcon name="warning" :size="13" /> KONDISI INVENTARIS</span>
            <h2>{{ insightTitle }}</h2><p>{{ insightMessage }}</p>
            <RouterLink to="/products">Buka katalog <AppIcon name="arrow" :size="13" /></RouterLink>
          </div>
          <div class="insight-graphic"><span>{{ lowStock.length }}</span><i>produk kritis</i></div>
        </article>
      </div>
      <p class="dashboard-footnote">Ringkasan penjualan mencakup seluruh order. Tren membandingkan 7 hari terakhir dengan 7 hari sebelumnya.</p>
    </template>
  </section>
</template>

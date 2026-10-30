<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { apiRequest } from '../lib/api'

type OrderDetail = {
  id: number
  order_number: string
  customer_id: string
  customer_name: string | null
  customer_address: string | null
  created_by: number
  total_amount: string
  order_date: string
  created_at: string
  updated_at: string
  items: {
    id: number
    product_id: number
    product_code: string | null
    product_name: string | null
    quantity: number
    unit_price: string
    subtotal: string
  }[]
}

const route = useRoute()
const orderId = computed(() => String(route.params.id))
const orderQuery = useQuery({
  queryKey: computed(() => ['orders', 'detail', orderId.value]),
  queryFn: () => apiRequest<OrderDetail>(`/orders/${encodeURIComponent(orderId.value)}`),
  refetchOnMount: 'always',
})
const order = computed(() => orderQuery.data.value)
const itemCount = computed(() => order.value?.items.reduce((total, item) => total + item.quantity, 0) ?? 0)
const moneyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function formatRupiah(value: string | number) { return moneyFormat.format(Number(value)) }
function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
</script>

<template>
  <section class="order-detail-page page-content">
    <RouterLink class="order-back-link" to="/orders"><AppIcon name="chevron" :size="15" /> Kembali ke riwayat order</RouterLink>

    <div v-if="orderQuery.isPending.value" class="panel order-detail-state" aria-live="polite">
      <span class="loading-spinner" /><strong>Memuat detail order</strong><p>Sedang mengambil informasi transaksi.</p>
    </div>
    <div v-else-if="orderQuery.isError.value" class="panel order-detail-state" role="alert">
      <span class="state-icon error"><AppIcon name="warning" :size="20" /></span>
      <strong>Detail order belum dapat dimuat</strong>
      <p>{{ orderQuery.error.value instanceof Error ? orderQuery.error.value.message : 'Order tidak ditemukan atau terjadi gangguan.' }}</p>
      <div class="order-detail-state-actions"><button class="secondary-action" @click="orderQuery.refetch()"><AppIcon name="download" :size="14" /> Coba lagi</button><RouterLink class="primary-action" to="/orders">Kembali ke riwayat</RouterLink></div>
    </div>

    <template v-else-if="order">
      <header class="order-detail-heading">
        <div><div class="welcome-eyebrow"><span class="live-dot" /> DETAIL TRANSAKSI</div><h1>Order {{ order.order_number }}</h1><p class="welcome-subtitle">Informasi lengkap transaksi penjualan dan item produk.</p></div>
        <span class="order-status-pill"><i /> Transaksi berhasil</span>
      </header>

      <section class="panel order-detail-card" aria-label="Informasi transaksi">
        <div class="order-detail-card-heading"><span class="state-icon"><AppIcon name="cart" :size="18" /></span><div><strong>Ringkasan transaksi</strong><small>Dibuat {{ formatDate(order.created_at) }}</small></div></div>
        <dl class="order-detail-metadata">
          <div><dt>Nomor order</dt><dd>{{ order.order_number }}</dd></div>
          <div><dt>Tanggal transaksi</dt><dd>{{ formatDate(order.order_date) }}</dd></div>
          <div><dt>Pelanggan</dt><dd>{{ order.customer_name || 'Pelanggan dihapus' }}</dd></div>
          <div><dt>Jumlah item</dt><dd>{{ itemCount }} unit · {{ order.items.length }} jenis produk</dd></div>
          <div v-if="order.customer_address" class="order-detail-wide"><dt>Alamat pelanggan</dt><dd>{{ order.customer_address }}</dd></div>
        </dl>
      </section>

      <section class="panel order-detail-card order-detail-products" aria-label="Rincian produk">
        <div class="order-detail-card-heading"><span class="state-icon"><AppIcon name="box" :size="18" /></span><div><strong>Rincian produk</strong><small>{{ order.items.length }} jenis produk dalam transaksi ini</small></div></div>
        <div v-if="order.items.length" class="order-detail-table-scroll">
          <table class="order-detail-table">
            <thead><tr><th>PRODUK</th><th class="order-detail-number">HARGA SATUAN</th><th class="order-detail-number">JUMLAH</th><th class="order-detail-number">SUBTOTAL</th></tr></thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.id">
                <td><div class="order-detail-product"><span class="product-avatar" :class="`product-color-${item.product_id % 5}`">{{ (item.product_name || 'P').slice(0, 1).toUpperCase() }}</span><span><strong>{{ item.product_name || `Produk #${item.product_id}` }}</strong><small>{{ item.product_code || 'Produk tidak lagi aktif' }}</small></span></div></td>
                <td class="order-detail-number">{{ formatRupiah(item.unit_price) }}</td>
                <td class="order-detail-number">{{ item.quantity }} unit</td>
                <td class="order-detail-number order-detail-subtotal">{{ formatRupiah(item.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="dashboard-panel-empty">Tidak ada item pada order ini.</div>
        <div class="order-detail-grand-total"><span>Total pembayaran</span><strong>{{ formatRupiah(order.total_amount) }}</strong></div>
      </section>
    </template>
  </section>
</template>

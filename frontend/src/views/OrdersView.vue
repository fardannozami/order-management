<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import AppIcon from '../components/AppIcon.vue'
import FeedbackToast from '../components/resources/FeedbackToast.vue'
import ResourcePageHeader from '../components/resources/ResourcePageHeader.vue'
import ResourceStats from '../components/resources/ResourceStats.vue'
import ResourceTablePanel from '../components/resources/ResourceTablePanel.vue'
import { apiRequest } from '../lib/api'
import { ApiRequestError } from '../stores/auth'

type Customer = { id: string; customer_name: string; phone: string | null }
type Product = { id: number; product_code: string; product_name: string; stock: number; price: string }
type Order = {
  id: number; order_number: string; customer_id: string; customer_name: string | null
  total_amount: string; order_date: string; created_at: string; item_count: number
}
type OrderPage = { data: Order[]; meta: { page: number; per_page: number; total: number; total_pages: number } }
type OrderDetail = Order & { customer_address: string | null; items: OrderItem[] }
type OrderItem = { id?: number; product_id: number; product_code?: string | null; product_name?: string | null; quantity: number; unit_price: string; subtotal: string }
type Page<T> = { data: T[]; meta: { total: number } }
type DraftItem = { product_id: number | ''; quantity: string }

const queryClient = useQueryClient()
const page = ref(1)
const perPage = 10
const from = ref('')
const to = ref('')
const customerFilter = ref('')
const appliedFrom = ref('')
const appliedTo = ref('')
const appliedCustomerFilter = ref('')
const dialog = ref<'create' | 'detail' | null>(null)
const selectedOrder = ref<Order | null>(null)
const customerId = ref('')
const items = reactive<DraftItem[]>([{ product_id: '', quantity: '1' }])
const formError = ref('')
const formErrors = reactive<Record<string, string>>({})
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

const ordersQuery = useQuery({
  queryKey: computed(() => ['orders', page.value, perPage, appliedFrom.value, appliedTo.value, appliedCustomerFilter.value]),
  queryFn: () => {
    const params = new URLSearchParams({ page: String(page.value), per_page: String(perPage) })
    if (appliedFrom.value) params.set('from', appliedFrom.value)
    if (appliedTo.value) params.set('to', appliedTo.value)
    if (appliedCustomerFilter.value) params.set('customer_id', appliedCustomerFilter.value)
    return apiRequest<OrderPage>(`/orders?${params}`)
  },
})
const customersQuery = useQuery({
  queryKey: ['orders', 'customers'],
  queryFn: () => apiRequest<Page<Customer>>('/customers?page=1&per_page=100'),
})
const productsQuery = useQuery({
  queryKey: ['orders', 'products'],
  queryFn: () => apiRequest<Page<Product>>('/products?page=1&per_page=100&sort=product_name&order=asc'),
  enabled: computed(() => dialog.value === 'create'),
})
const detailQuery = useQuery({
  queryKey: computed(() => ['orders', 'detail', selectedOrder.value?.id]),
  queryFn: () => apiRequest<OrderDetail>(`/orders/${selectedOrder.value?.id}`),
  enabled: computed(() => dialog.value === 'detail' && selectedOrder.value !== null),
})

const createMutation = useMutation({
  mutationFn: (payload: { customer_id: string; items: { product_id: number; quantity: number }[] }) =>
    apiRequest<OrderDetail>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  onSuccess: async (order) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
    closeDialog()
    showFeedback(`Order ${order.order_number} berhasil dibuat.`)
  },
})

const rows = computed(() => ordersQuery.data.value?.data ?? [])
const meta = computed(() => ordersQuery.data.value?.meta)
const totalPages = computed(() => Math.max(1, meta.value?.total_pages ?? 1))
const stats = computed(() => [{
  label: 'Total transaksi', value: meta.value?.total ?? (ordersQuery.isPending.value ? '…' : 0),
  suffix: 'order', icon: 'cart', tone: 'purple' as const,
}])
const customers = computed(() => customersQuery.data.value?.data ?? [])
const products = computed(() => productsQuery.data.value?.data ?? [])
const selectedProducts = computed(() => new Set(items.map((item) => item.product_id).filter((id): id is number => typeof id === 'number')))
const draftLines = computed(() => items.map((item) => {
  const product = products.value.find((candidate) => candidate.id === item.product_id)
  const quantity = Number(item.quantity) || 0
  return { ...item, product, quantity, subtotal: product ? Number(product.price) * quantity : 0 }
}))
const draftTotal = computed(() => draftLines.value.reduce((sum, line) => sum + line.subtotal, 0))
const detailOrder = computed(() => detailQuery.data.value ?? (selectedOrder.value as OrderDetail | null))

function formatRupiah(value: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value))
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
function applyDateFilter() {
  if (from.value && to.value && from.value > to.value) {
    showFeedback('Tanggal mulai tidak boleh melewati tanggal akhir.', 'error')
    return
  }
  page.value = 1
  appliedFrom.value = from.value
  appliedTo.value = to.value
  appliedCustomerFilter.value = customerFilter.value
}
function clearDateFilter() {
  from.value = ''
  to.value = ''
  customerFilter.value = ''
  appliedFrom.value = ''
  appliedTo.value = ''
  appliedCustomerFilter.value = ''
  page.value = 1
}
function openCreate() {
  customerId.value = ''
  items.splice(0, items.length, { product_id: '', quantity: '1' })
  formError.value = ''
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
  dialog.value = 'create'
}
function openDetail(order: Order) {
  selectedOrder.value = order
  dialog.value = 'detail'
}
function closeDialog() {
  dialog.value = null
  selectedOrder.value = null
  formError.value = ''
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
}
function addItem() { items.push({ product_id: '', quantity: '1' }) }
function removeItem(index: number) { if (items.length > 1) items.splice(index, 1) }
function productOptions(item: DraftItem) {
  return products.value.filter((product) => product.id === item.product_id || !selectedProducts.value.has(product.id))
}
function validateOrder() {
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
  formError.value = ''
  if (!customerId.value) formErrors.customer_id = 'Pilih pelanggan untuk order ini.'
  if (!items.length) formErrors.items = 'Tambahkan minimal satu produk.'
  items.forEach((item, index) => {
    if (!item.product_id) formErrors[`items.${index}.product_id`] = 'Pilih produk.'
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) formErrors[`items.${index}.quantity`] = 'Jumlah minimal 1.'
    const product = products.value.find((candidate) => candidate.id === item.product_id)
    if (product && quantity > product.stock) formErrors[`items.${index}.quantity`] = `Stok tersisa ${product.stock} unit.`
  })
  return Object.keys(formErrors).length === 0
}
async function submitOrder() {
  if (!validateOrder() || createMutation.isPending.value) return
  try {
    await createMutation.mutateAsync({
      customer_id: customerId.value,
      items: items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) })),
    })
  } catch (error) {
    if (error instanceof ApiRequestError) {
      formError.value = error.message
      for (const [field, messages] of Object.entries(error.errors ?? {})) {
        if (messages[0]) formErrors[field] = messages[0]
      }
    } else formError.value = 'Order belum dapat dibuat. Coba lagi.'
  }
}
function showFeedback(message: string, type: 'success' | 'error' = 'success') {
  feedback.value = { type, message }
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { feedback.value = null }, 4500)
}
watch(() => meta.value?.total_pages, (pages) => { if (pages && page.value > pages) page.value = pages })
onBeforeUnmount(() => { if (feedbackTimer) clearTimeout(feedbackTimer) })
</script>

<template>
  <section class="orders-page page-content">
    <ResourcePageHeader eyebrow="TRANSAKSI PENJUALAN" title="Order" description="Buat transaksi, cek stok secara langsung, dan telusuri riwayat penjualan." action-label="Buat order" @action="openCreate" />
    <ResourceStats :items="stats" note="Stok produk diperbarui otomatis setelah order dibuat" />

    <div class="products-card orders-filter-card">
      <div class="orders-filter-title"><span class="state-icon"><AppIcon name="calendar" :size="17" /></span><span><strong>Filter tanggal</strong><small>Pilih rentang tanggal transaksi.</small></span></div>
      <div class="orders-filter-fields">
        <label><span>Pelanggan</span><select v-model="customerFilter"><option value="">Semua pelanggan</option><option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.customer_name }}</option></select></label>
        <label><span>Dari tanggal</span><input v-model="from" type="date" :max="to || undefined" /></label>
        <label><span>Sampai tanggal</span><input v-model="to" type="date" :min="from || undefined" /></label>
        <button class="primary-action" @click="applyDateFilter">Terapkan</button>
        <button v-if="appliedFrom || appliedTo || appliedCustomerFilter" class="secondary-action" @click="clearDateFilter">Hapus filter</button>
      </div>
    </div>

    <ResourceTablePanel
      title="Riwayat order" description="Semua transaksi penjualan yang tercatat di sistem."
      :search="''" search-placeholder="Pencarian belum tersedia" :show-search="false" :loading="ordersQuery.isPending.value"
      :error="ordersQuery.isError.value" error-title="Riwayat order belum dapat dimuat"
      :error-message="ordersQuery.error.value instanceof Error ? ordersQuery.error.value.message : 'Terjadi gangguan saat mengambil data.'"
      :empty="rows.length === 0" :empty-title="appliedFrom || appliedTo || appliedCustomerFilter ? 'Order tidak ditemukan' : 'Belum ada order'"
      :empty-description="appliedFrom || appliedTo || appliedCustomerFilter ? 'Ubah filter untuk melihat transaksi lain.' : 'Buat order pertama untuk mulai mencatat penjualan.'"
      empty-icon="cart" item-label="order" :total="meta?.total ?? 0" :page="page" :per-page="perPage" :total-pages="totalPages"
      @update:page="page = $event" @retry="ordersQuery.refetch()"
    >
      <template #table>
        <table class="products-table orders-table">
          <thead><tr><th>NOMOR ORDER</th><th>PELANGGAN</th><th>TANGGAL</th><th>ITEM</th><th class="orders-amount-heading">TOTAL</th><th class="actions-column">AKSI</th></tr></thead>
          <tbody>
            <tr v-for="order in rows" :key="order.id">
              <td><button class="product-code-link" @click="openDetail(order)">{{ order.order_number }}</button></td>
              <td><div class="order-customer-cell"><span class="customer-avatar customer-color-0">{{ (order.customer_name || '?').slice(0, 1).toUpperCase() }}</span><strong>{{ order.customer_name || 'Pelanggan dihapus' }}</strong></div></td>
              <td class="product-date">{{ formatDate(order.order_date) }}</td>
              <td><span class="order-item-count">{{ order.item_count }} produk</span></td>
              <td class="product-price orders-amount">{{ formatRupiah(order.total_amount) }}</td>
              <td><div class="row-actions"><button class="row-action" title="Detail order" :aria-label="`Detail ${order.order_number}`" @click="openDetail(order)"><AppIcon name="eye" :size="15" /></button></div></td>
            </tr>
          </tbody>
        </table>
      </template>
    </ResourceTablePanel>
    <FeedbackToast :feedback="feedback" @dismiss="feedback = null" />

    <Transition name="modal-fade">
      <div v-if="dialog === 'create'" class="dialog-backdrop order-backdrop" @click.self="closeDialog">
        <form class="product-dialog order-create-dialog" aria-labelledby="order-form-title" @submit.prevent="submitOrder">
          <div class="dialog-header"><div><span class="dialog-kicker">TRANSAKSI BARU</span><h2 id="order-form-title">Buat order</h2><p>Pilih pelanggan dan produk untuk mencatat penjualan.</p></div><button type="button" class="dialog-close" aria-label="Tutup" @click="closeDialog"><AppIcon name="close" /></button></div>
          <div v-if="formError" class="form-server-error" role="alert"><AppIcon name="warning" :size="15" /> {{ formError }}</div>
          <div v-if="customersQuery.isError.value || productsQuery.isError.value" class="form-server-error" role="alert"><AppIcon name="warning" :size="15" /> Data pelanggan atau produk belum dapat dimuat. Tutup lalu coba lagi.</div>
          <label class="form-field"><span>Pelanggan <b>*</b></span><select v-model="customerId" required :disabled="customersQuery.isPending.value"><option value="" disabled>{{ customersQuery.isPending.value ? 'Memuat pelanggan…' : 'Pilih pelanggan' }}</option><option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.customer_name }}{{ customer.phone ? ` · ${customer.phone}` : '' }}</option></select><small v-if="formErrors.customer_id" class="field-error">{{ formErrors.customer_id }}</small></label>
          <div class="order-items-heading"><div><strong>Produk yang dibeli</strong><small>Harga dan subtotal mengikuti katalog aktif.</small></div><button type="button" class="secondary-action" :disabled="productsQuery.isPending.value || productsQuery.isError.value || products.length === 0" @click="addItem"><AppIcon name="plus" :size="13" /> Tambah produk</button></div>
          <div v-if="productsQuery.isPending.value" class="detail-loading"><span class="loading-spinner" /> Memuat katalog produk…</div>
          <div v-else-if="products.length === 0" class="order-no-products">Belum ada produk tersedia. Tambahkan produk dengan stok terlebih dahulu.</div>
          <div v-else class="order-line-list">
            <div v-for="(item, index) in items" :key="index" class="order-line">
              <label class="form-field"><span>Produk {{ index + 1 }}</span><select v-model.number="item.product_id" required><option value="" disabled>Pilih produk</option><option v-for="product in productOptions(item)" :key="product.id" :value="product.id" :disabled="product.stock < 1">{{ product.product_code }} · {{ product.product_name }} — {{ product.stock }} stok</option></select><small v-if="formErrors[`items.${index}.product_id`]" class="field-error">{{ formErrors[`items.${index}.product_id`] }}</small></label>
              <label class="form-field order-quantity"><span>Qty</span><input v-model="item.quantity" type="number" min="1" step="1" :max="products.find((product) => product.id === item.product_id)?.stock" required /><small v-if="formErrors[`items.${index}.quantity`]" class="field-error">{{ formErrors[`items.${index}.quantity`] }}</small></label>
              <div class="order-line-total"><small>Subtotal</small><strong>{{ formatRupiah(draftLines[index]?.subtotal ?? 0) }}</strong></div>
              <button type="button" class="row-action danger order-remove" title="Hapus produk" :disabled="items.length === 1" @click="removeItem(index)"><AppIcon name="trash" :size="15" /></button>
            </div>
          </div>
          <small v-if="formErrors.items" class="field-error">{{ formErrors.items }}</small>
          <div class="order-total"><span>Total pembayaran</span><strong>{{ formatRupiah(draftTotal) }}</strong></div>
          <div class="dialog-footer"><button type="button" class="secondary-action" @click="closeDialog">Batal</button><button type="submit" class="primary-action" :disabled="createMutation.isPending.value || products.length === 0"><span v-if="createMutation.isPending.value" class="button-spinner" />{{ createMutation.isPending.value ? 'Memproses…' : 'Simpan order' }}</button></div>
        </form>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="dialog === 'detail' && selectedOrder" class="dialog-backdrop" @click.self="closeDialog">
        <section class="product-dialog detail-dialog order-detail-dialog" aria-labelledby="order-detail-title">
          <div class="dialog-header"><div><span class="dialog-kicker">RIWAYAT TRANSAKSI</span><h2 id="order-detail-title">Detail order</h2><p>{{ selectedOrder.order_number }}</p></div><button class="dialog-close" aria-label="Tutup" @click="closeDialog"><AppIcon name="close" /></button></div>
          <div v-if="detailQuery.isPending.value" class="detail-loading"><span class="loading-spinner" /> Memuat detail order…</div>
          <div v-else-if="detailQuery.isError.value" class="form-server-error"><AppIcon name="warning" :size="15" /> {{ detailQuery.error.value instanceof Error ? detailQuery.error.value.message : 'Detail order gagal dimuat.' }}</div>
          <template v-else-if="detailOrder">
            <dl class="order-detail-summary"><div><dt>Pelanggan</dt><dd>{{ detailOrder.customer_name || 'Pelanggan dihapus' }}</dd></div><div><dt>Tanggal transaksi</dt><dd>{{ formatDate(detailOrder.order_date) }}</dd></div><div v-if="detailOrder.customer_address" class="detail-wide"><dt>Alamat pelanggan</dt><dd>{{ detailOrder.customer_address }}</dd></div></dl>
            <div class="order-detail-items"><div v-for="line in detailOrder.items" :key="line.id ?? line.product_id" class="order-detail-line"><span><strong>{{ line.product_name || `Produk #${line.product_id}` }}</strong><small>{{ line.product_code || '' }} · {{ line.quantity }} × {{ formatRupiah(line.unit_price) }}</small></span><strong>{{ formatRupiah(line.subtotal) }}</strong></div></div>
            <div class="order-total"><span>Total pembayaran</span><strong>{{ formatRupiah(detailOrder.total_amount) }}</strong></div>
          </template>
          <div class="dialog-footer"><button class="secondary-action" @click="closeDialog">Tutup</button></div>
        </section>
      </div>
    </Transition>
  </section>
</template>

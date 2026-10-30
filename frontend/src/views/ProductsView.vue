<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import AppIcon from '../components/AppIcon.vue'
import ConfirmDeleteDialog from '../components/resources/ConfirmDeleteDialog.vue'
import FeedbackToast from '../components/resources/FeedbackToast.vue'
import ResourcePageHeader from '../components/resources/ResourcePageHeader.vue'
import ResourceStats from '../components/resources/ResourceStats.vue'
import ResourceTablePanel from '../components/resources/ResourceTablePanel.vue'
import { apiRequest } from '../lib/api'
import { ApiRequestError } from '../stores/auth'

type Product = {
  id: number
  product_code: string
  product_name: string
  stock: number
  price: string
  created_at: string
  updated_at: string
}
type ProductPage = {
  data: Product[]
  meta: { page: number; per_page: number; total: number; total_pages: number }
}
type DashboardSummary = {
  low_stock_products: { id: number; product_code: string; product_name: string; stock: number }[]
}
type ProductInput = { product_code: string; product_name: string; stock: number; price: number }
type SortField = 'product_name' | 'price' | 'stock'

const queryClient = useQueryClient()
const page = ref(1)
const perPage = 10
const searchInput = ref('')
const search = ref('')
const sort = ref<SortField>('product_name')
const order = ref<'asc' | 'desc'>('asc')
const dialog = ref<'create' | 'edit' | 'detail' | 'delete' | null>(null)
const selectedProduct = ref<Product | null>(null)
const form = reactive({ product_code: '', product_name: '', stock: '0', price: '' })
const formErrors = reactive<Record<string, string>>({})
const formError = ref('')
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    search.value = value.trim()
    page.value = 1
  }, 300)
})

const productsQuery = useQuery({
  queryKey: computed(() => ['products', page.value, perPage, search.value, sort.value, order.value]),
  queryFn: () => {
    const params = new URLSearchParams({
      page: String(page.value),
      per_page: String(perPage),
      sort: sort.value,
      order: order.value,
    })
    if (search.value) params.set('search', search.value)
    return apiRequest<ProductPage>(`/products?${params.toString()}`)
  },
})

const dashboardQuery = useQuery({
  queryKey: ['dashboard', 'summary'],
  queryFn: () => apiRequest<DashboardSummary>('/dashboard/summary'),
})

const detailQuery = useQuery({
  queryKey: computed(() => ['products', 'detail', selectedProduct.value?.id]),
  queryFn: () => apiRequest<Product>(`/products/${selectedProduct.value?.id}`),
  enabled: computed(() => dialog.value === 'detail' && selectedProduct.value !== null),
})

const saveMutation = useMutation({
  mutationFn: ({ id, input }: { id: number | null; input: ProductInput }) => apiRequest<Product>(
    id === null ? '/products' : `/products/${id}`,
    { method: id === null ? 'POST' : 'PUT', body: JSON.stringify(input) },
  ),
  onSuccess: async (_product, variables) => {
    await queryClient.invalidateQueries({ queryKey: ['products'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    closeDialog()
    showFeedback(variables.id === null ? 'Produk berhasil ditambahkan.' : 'Perubahan produk berhasil disimpan.')
  },
})

const deleteMutation = useMutation({
  mutationFn: (id: number) => apiRequest<void>(`/products/${id}`, { method: 'DELETE' }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['products'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    closeDialog()
    showFeedback('Produk berhasil dihapus dari katalog.')
  },
})

const rows = computed(() => productsQuery.data.value?.data ?? [])
const meta = computed(() => productsQuery.data.value?.meta)
const lowStockCount = computed(() => dashboardQuery.data.value?.low_stock_products.length)
const stats = computed(() => [
  { label: 'Total produk', value: meta.value?.total ?? '—', icon: 'box', tone: 'purple' as const },
  {
    label: 'Stok kritis (<5)',
    value: dashboardQuery.isPending.value ? '…' : dashboardQuery.isError.value ? '—' : lowStockCount.value ?? 0,
    suffix: 'produk', icon: 'warning', tone: 'red' as const,
  },
])
const totalPages = computed(() => Math.max(1, meta.value?.total_pages ?? 1))
const detailProduct = computed(() => detailQuery.data.value ?? selectedProduct.value)

function formatRupiah(value: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function toggleSort(field: SortField) {
  if (sort.value === field) order.value = order.value === 'asc' ? 'desc' : 'asc'
  else { sort.value = field; order.value = 'asc' }
  page.value = 1
}

function sortIcon(field: SortField) {
  return sort.value !== field ? '↕' : order.value === 'asc' ? '↑' : '↓'
}

function clearFormErrors() {
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
}

function updateNumericField(field: 'stock' | 'price', event: Event) {
  form[field] = (event.target as HTMLInputElement).value
}

function openCreate() {
  selectedProduct.value = null
  Object.assign(form, { product_code: '', product_name: '', stock: '0', price: '' })
  clearFormErrors()
  formError.value = ''
  dialog.value = 'create'
}

function openEdit(product: Product) {
  selectedProduct.value = product
  Object.assign(form, {
    product_code: product.product_code,
    product_name: product.product_name,
    stock: String(product.stock),
    price: String(Number(product.price)),
  })
  clearFormErrors()
  formError.value = ''
  dialog.value = 'edit'
}

function openDetail(product: Product) {
  selectedProduct.value = product
  dialog.value = 'detail'
}

function openDelete(product: Product) {
  selectedProduct.value = product
  dialog.value = 'delete'
}

function closeDialog() {
  dialog.value = null
  selectedProduct.value = null
  formError.value = ''
  clearFormErrors()
}

function validateForm(): ProductInput | null {
  clearFormErrors()
  const productCode = form.product_code.trim()
  const productName = form.product_name.trim()
  const stock = Number(form.stock)
  const price = Number(form.price)
  if (!productCode || productCode.length > 20) formErrors.product_code = 'Kode wajib diisi, maksimal 20 karakter.'
  if (!productName || productName.length > 150) formErrors.product_name = 'Nama wajib diisi, maksimal 150 karakter.'
  if (form.stock.trim() === '' || !Number.isInteger(stock) || stock < 0 || stock > 2147483647) formErrors.stock = 'Stok harus berupa bilangan bulat minimal 0.'
  if (form.price.trim() === '' || !Number.isFinite(price) || price <= 0 || price > 9999999999.99) formErrors.price = 'Harga harus lebih dari Rp 0.'
  if (form.price.includes('.') && form.price.split('.')[1].length > 2) formErrors.price = 'Harga maksimal memiliki 2 angka desimal.'
  if (Object.keys(formErrors).length) return null
  return { product_code: productCode, product_name: productName, stock, price }
}

function applyServerErrors(error: unknown) {
  if (error instanceof ApiRequestError) {
    formError.value = error.message
    for (const [field, messages] of Object.entries(error.errors ?? {})) {
      if (field in formErrors && messages[0]) formErrors[field] = messages[0]
    }
  } else {
    formError.value = 'Produk belum dapat disimpan. Coba lagi.'
  }
}

async function submitForm() {
  const input = validateForm()
  if (!input || saveMutation.isPending.value) return
  formError.value = ''
  try {
    await saveMutation.mutateAsync({ id: dialog.value === 'edit' ? selectedProduct.value?.id ?? null : null, input })
  } catch (error) {
    applyServerErrors(error)
  }
}

async function confirmDelete() {
  if (!selectedProduct.value || deleteMutation.isPending.value) return
  try {
    await deleteMutation.mutateAsync(selectedProduct.value.id)
  } catch (error) {
    showFeedback(error instanceof ApiRequestError ? error.message : 'Produk belum dapat dihapus. Coba lagi.', 'error')
  }
}

function showFeedback(message: string, type: 'success' | 'error' = 'success') {
  feedback.value = { type, message }
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { feedback.value = null }, 4000)
}

function stockTone(stock: number) {
  if (stock < 5) return 'stock-critical'
  if (stock < 10) return 'stock-warning'
  return 'stock-healthy'
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (feedbackTimer) clearTimeout(feedbackTimer)
})
</script>

<template>
  <section class="products-page page-content">
    <ResourcePageHeader eyebrow="KATALOG INVENTARIS" title="Produk" description="Kelola katalog, harga, dan ketersediaan produk tokomu." action-label="Tambah produk" @action="openCreate" />
    <ResourceStats :items="stats" note="Ambang stok kritis: kurang dari 5 unit" />

    <ResourceTablePanel
      title="Daftar produk"
      description="Kelola dan pantau semua produk yang tersedia."
      :search="searchInput"
      search-placeholder="Cari nama atau kode..."
      :loading="productsQuery.isPending.value"
      :error="productsQuery.isError.value"
      error-title="Produk belum dapat dimuat"
      :error-message="productsQuery.error.value instanceof Error ? productsQuery.error.value.message : 'Terjadi gangguan saat mengambil data.'"
      :empty="rows.length === 0"
      :empty-title="search ? 'Produk tidak ditemukan' : 'Belum ada produk'"
      :empty-description="search ? 'Coba kata kunci lain atau hapus pencarian.' : 'Tambahkan produk pertama ke katalog tokomu.'"
      empty-icon="box"
      item-label="produk"
      :total="meta?.total ?? 0"
      :page="page"
      :per-page="perPage"
      :total-pages="totalPages"
      @update:search="searchInput = $event"
      @update:page="page = $event"
      @retry="productsQuery.refetch()"
    >
      <template #empty-action>
        <button v-if="!search" class="secondary-action" @click="openCreate"><AppIcon name="plus" :size="14" /> Tambah produk</button>
      </template>
      <template #table>
        <table class="products-table">
          <thead>
            <tr><th class="code-column">KODE PRODUK</th><th><button class="sort-button" @click="toggleSort('product_name')">NAMA PRODUK <span>{{ sortIcon('product_name') }}</span></button></th><th><button class="sort-button" @click="toggleSort('price')">HARGA <span>{{ sortIcon('price') }}</span></button></th><th><button class="sort-button" @click="toggleSort('stock')">STOK <span>{{ sortIcon('stock') }}</span></button></th><th>DITAMBAHKAN</th><th class="actions-column">AKSI</th></tr>
          </thead>
          <tbody>
            <tr v-for="product in rows" :key="product.id">
              <td><button class="product-code-link" @click="openDetail(product)">{{ product.product_code }}</button></td>
              <td><div class="product-name-cell"><span class="product-avatar" :class="`product-color-${product.id % 5}`">{{ product.product_name.slice(0, 1).toUpperCase() }}</span><strong>{{ product.product_name }}</strong></div></td>
              <td class="product-price">{{ formatRupiah(product.price) }}</td>
              <td><span class="stock-pill" :class="stockTone(product.stock)" :title="product.stock < 5 ? 'Stok kritis: kurang dari 5 unit' : product.stock < 10 ? 'Perhatian: stok di bawah 10 unit, tetapi belum kritis' : 'Stok aman'"><i />{{ product.stock }} <small>{{ product.stock < 5 ? 'kritis' : product.stock < 10 ? 'perhatian' : 'unit' }}</small></span></td>
              <td class="product-date">{{ formatDate(product.created_at) }}</td>
              <td><div class="row-actions"><button class="row-action" title="Detail produk" aria-label="Detail produk" @click="openDetail(product)"><AppIcon name="eye" :size="15" /></button><button class="row-action" title="Edit produk" aria-label="Edit produk" @click="openEdit(product)"><AppIcon name="edit" :size="15" /></button><button class="row-action danger" title="Hapus produk" aria-label="Hapus produk" @click="openDelete(product)"><AppIcon name="trash" :size="15" /></button></div></td>
            </tr>
          </tbody>
        </table>
      </template>
    </ResourceTablePanel>
    <div class="products-footnote"><AppIcon name="check" :size="13" /> Penghapusan produk menggunakan soft delete. Riwayat transaksi tetap tersimpan.</div>

    <Transition name="modal-fade">
      <div v-if="dialog === 'create' || dialog === 'edit'" class="dialog-backdrop" @click.self="closeDialog">
        <form class="product-dialog" aria-labelledby="product-form-title" @submit.prevent="submitForm">
          <div class="dialog-header"><div><span class="dialog-kicker">KATALOG PRODUK</span><h2 id="product-form-title">{{ dialog === 'create' ? 'Tambah produk' : 'Edit produk' }}</h2><p>Lengkapi informasi produk di bawah ini.</p></div><button type="button" class="dialog-close" aria-label="Tutup" @click="closeDialog"><AppIcon name="close" /></button></div>
          <div v-if="formError" class="form-server-error" role="alert"><AppIcon name="warning" :size="15" /> {{ formError }}</div>
          <div class="form-grid">
            <label class="form-field"><span>Kode produk <b>*</b></span><input v-model="form.product_code" maxlength="20" placeholder="Contoh: P0001" autocomplete="off" /><small v-if="formErrors.product_code" class="field-error">{{ formErrors.product_code }}</small></label>
            <label class="form-field"><span>Nama produk <b>*</b></span><input v-model="form.product_name" maxlength="150" placeholder="Nama produk" autocomplete="off" /><small v-if="formErrors.product_name" class="field-error">{{ formErrors.product_name }}</small></label>
            <label class="form-field"><span>Harga (Rp) <b>*</b></span><input :value="form.price" type="number" min="0.01" max="9999999999.99" step="0.01" placeholder="12000" @input="updateNumericField('price', $event)" /><small v-if="formErrors.price" class="field-error">{{ formErrors.price }}</small></label>
            <label class="form-field"><span>Stok <b>*</b></span><input :value="form.stock" type="number" min="0" max="2147483647" step="1" placeholder="0" @input="updateNumericField('stock', $event)" /><small v-if="formErrors.stock" class="field-error">{{ formErrors.stock }}</small></label>
          </div>
          <div class="dialog-footer"><button type="button" class="secondary-action" @click="closeDialog">Batal</button><button type="submit" class="primary-action" :disabled="saveMutation.isPending.value"><span v-if="saveMutation.isPending.value" class="button-spinner" />{{ saveMutation.isPending.value ? 'Menyimpan…' : dialog === 'create' ? 'Simpan produk' : 'Simpan perubahan' }}</button></div>
        </form>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="dialog === 'detail' && selectedProduct" class="dialog-backdrop" @click.self="closeDialog">
        <section class="product-dialog detail-dialog" aria-labelledby="product-detail-title">
          <div class="dialog-header"><div><span class="dialog-kicker">DETAIL KATALOG</span><h2 id="product-detail-title">Informasi produk</h2><p>Data lengkap produk terpilih.</p></div><button class="dialog-close" aria-label="Tutup" @click="closeDialog"><AppIcon name="close" /></button></div>
          <div v-if="detailQuery.isPending.value" class="detail-loading"><span class="loading-spinner" /> Memuat detail produk…</div>
          <div v-else-if="detailQuery.isError.value" class="form-server-error"><AppIcon name="warning" :size="15" /> {{ detailQuery.error.value instanceof Error ? detailQuery.error.value.message : 'Detail produk gagal dimuat.' }}</div>
          <div v-else-if="detailProduct" class="detail-content"><div class="detail-product-heading"><span class="product-avatar large" :class="`product-color-${detailProduct.id % 5}`">{{ detailProduct.product_name.slice(0, 1).toUpperCase() }}</span><span><strong>{{ detailProduct.product_name }}</strong><small>{{ detailProduct.product_code }}</small></span></div><dl><div><dt>Harga</dt><dd>{{ formatRupiah(detailProduct.price) }}</dd></div><div><dt>Stok tersedia</dt><dd>{{ detailProduct.stock }} unit</dd></div><div><dt>Dibuat</dt><dd>{{ formatDate(detailProduct.created_at) }}</dd></div><div><dt>Terakhir diperbarui</dt><dd>{{ formatDate(detailProduct.updated_at) }}</dd></div></dl></div>
          <div class="dialog-footer"><button class="secondary-action" @click="closeDialog">Tutup</button><button v-if="detailProduct" class="primary-action" @click="openEdit(detailProduct)"><AppIcon name="edit" :size="14" /> Edit produk</button></div>
        </section>
      </div>
    </Transition>

    <ConfirmDeleteDialog
      v-if="dialog === 'delete' && selectedProduct"
      entity-label="produk"
      :entity-name="selectedProduct.product_name"
      :pending="deleteMutation.isPending.value"
      :error="deleteMutation.error.value instanceof Error ? deleteMutation.error.value.message : ''"
      confirm-label="Ya, hapus produk"
      @close="closeDialog"
      @confirm="confirmDelete"
    >
      akan dihapus dari katalog aktif. Produk pada riwayat order tetap tersimpan.
    </ConfirmDeleteDialog>

    <FeedbackToast :feedback="feedback" @dismiss="feedback = null" />
  </section>
</template>

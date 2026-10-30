<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import DatePicker from 'primevue/datepicker'
import AppIcon from '../components/AppIcon.vue'
import ConfirmDeleteDialog from '../components/resources/ConfirmDeleteDialog.vue'
import FeedbackToast from '../components/resources/FeedbackToast.vue'
import ResourcePageHeader from '../components/resources/ResourcePageHeader.vue'
import ResourceStats from '../components/resources/ResourceStats.vue'
import ResourceTablePanel from '../components/resources/ResourceTablePanel.vue'
import { apiRequest } from '../lib/api'
import { ApiRequestError } from '../stores/auth'

type Customer = {
  id: string
  customer_name: string
  customer_address: string
  gender: 'Pria' | 'Wanita'
  birth_date: string
  phone: string | null
  created_at: string
  updated_at: string
}
type CustomerPage = {
  data: Customer[]
  meta: { page: number; per_page: number; total: number; total_pages: number }
}
type CustomerInput = {
  customer_name: string
  customer_address: string
  gender: 'Pria' | 'Wanita'
  birth_date: string
  phone: string | null
}

const queryClient = useQueryClient()
const page = ref(1)
const perPage = 10
const searchInput = ref('')
const search = ref('')
const dialog = ref<'create' | 'edit' | 'detail' | 'delete' | null>(null)
const selectedCustomer = ref<Customer | null>(null)
const form = reactive({ customer_name: '', customer_address: '', gender: '' as '' | 'Pria' | 'Wanita', birth_date: '', phone: '' })
const birthDateValue = computed<Date | null>({
  get() {
    if (!form.birth_date) return null
    const [year, month, day] = form.birth_date.split('-').map(Number)
    return new Date(year, month - 1, day)
  },
  set(value) {
    if (!value) {
      form.birth_date = ''
      return
    }
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    form.birth_date = `${year}-${month}-${day}`
  },
})
const maxBirthDate = new Date()
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

const customersQuery = useQuery({
  queryKey: computed(() => ['customers', page.value, perPage, search.value]),
  queryFn: () => {
    const params = new URLSearchParams({ page: String(page.value), per_page: String(perPage) })
    if (search.value) params.set('search', search.value)
    return apiRequest<CustomerPage>(`/customers?${params.toString()}`)
  },
})

const detailQuery = useQuery({
  queryKey: computed(() => ['customers', 'detail', selectedCustomer.value?.id]),
  queryFn: () => apiRequest<Customer>(`/customers/${selectedCustomer.value?.id}`),
  enabled: computed(() => dialog.value === 'detail' && selectedCustomer.value !== null),
})

const saveMutation = useMutation({
  mutationFn: ({ id, input }: { id: string | null; input: CustomerInput }) => apiRequest<Customer>(
    id === null ? '/customers' : `/customers/${id}`,
    { method: id === null ? 'POST' : 'PUT', body: JSON.stringify(input) },
  ),
  onSuccess: async (_customer, variables) => {
    await queryClient.invalidateQueries({ queryKey: ['customers'] })
    closeDialog()
    showFeedback(variables.id === null ? 'Pelanggan berhasil ditambahkan.' : 'Perubahan pelanggan berhasil disimpan.')
  },
})

const deleteMutation = useMutation({
  mutationFn: (id: string) => apiRequest<void>(`/customers/${id}`, { method: 'DELETE' }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['customers'] })
    closeDialog()
    showFeedback('Pelanggan berhasil dihapus dari daftar aktif.')
  },
})

const rows = computed(() => customersQuery.data.value?.data ?? [])
const meta = computed(() => customersQuery.data.value?.meta)
const totalPages = computed(() => Math.max(1, meta.value?.total_pages ?? 1))
const detailCustomer = computed(() => detailQuery.data.value ?? selectedCustomer.value)
const stats = computed(() => [{
  label: 'Total pelanggan aktif',
  value: customersQuery.isPending.value ? '…' : customersQuery.isError.value ? '—' : meta.value?.total ?? 0,
  suffix: 'pelanggan', icon: 'users', tone: 'purple' as const,
}])

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value.slice(0, 10)}T00:00:00`))
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function clearFormErrors() {
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
}

function openCreate() {
  selectedCustomer.value = null
  Object.assign(form, { customer_name: '', customer_address: '', gender: '', birth_date: '', phone: '' })
  clearFormErrors()
  formError.value = ''
  dialog.value = 'create'
}

function openEdit(customer: Customer) {
  selectedCustomer.value = customer
  Object.assign(form, {
    customer_name: customer.customer_name,
    customer_address: customer.customer_address,
    gender: customer.gender,
    birth_date: customer.birth_date.slice(0, 10),
    phone: customer.phone ?? '',
  })
  clearFormErrors()
  formError.value = ''
  dialog.value = 'edit'
}

function openDetail(customer: Customer) {
  selectedCustomer.value = customer
  dialog.value = 'detail'
}

function openDelete(customer: Customer) {
  selectedCustomer.value = customer
  dialog.value = 'delete'
}

function closeDialog() {
  dialog.value = null
  selectedCustomer.value = null
  formError.value = ''
  clearFormErrors()
}

function validateForm(): CustomerInput | null {
  clearFormErrors()
  const name = form.customer_name.trim()
  const address = form.customer_address.trim()
  const birthDate = form.birth_date
  const phone = form.phone.trim()
  if (!name || name.length > 150) formErrors.customer_name = 'Nama wajib diisi, maksimal 150 karakter.'
  if (!address || address.length > 255) formErrors.customer_address = 'Alamat wajib diisi, maksimal 255 karakter.'
  if (form.gender !== 'Pria' && form.gender !== 'Wanita') formErrors.gender = 'Pilih gender pelanggan.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(Date.parse(`${birthDate}T00:00:00`))) {
    formErrors.birth_date = 'Tanggal lahir wajib diisi dengan tanggal yang valid.'
  } else if (birthDate > new Date().toISOString().slice(0, 10)) {
    formErrors.birth_date = 'Tanggal lahir tidak boleh di masa depan.'
  }
  if (phone.length > 20) formErrors.phone = 'Nomor HP maksimal 20 karakter.'
  if (Object.keys(formErrors).length) return null
  return { customer_name: name, customer_address: address, gender: form.gender as 'Pria' | 'Wanita', birth_date: birthDate, phone: phone || null }
}

function applyServerErrors(error: unknown) {
  if (error instanceof ApiRequestError) {
    formError.value = error.message
    for (const [field, messages] of Object.entries(error.errors ?? {})) {
      if (field in formErrors && messages[0]) formErrors[field] = messages[0]
    }
  } else {
    formError.value = 'Pelanggan belum dapat disimpan. Coba lagi.'
  }
}

async function submitForm() {
  const input = validateForm()
  if (!input || saveMutation.isPending.value) return
  formError.value = ''
  try {
    await saveMutation.mutateAsync({ id: dialog.value === 'edit' ? selectedCustomer.value?.id ?? null : null, input })
  } catch (error) {
    applyServerErrors(error)
  }
}

async function confirmDelete() {
  if (!selectedCustomer.value || deleteMutation.isPending.value) return
  try {
    await deleteMutation.mutateAsync(selectedCustomer.value.id)
  } catch (error) {
    showFeedback(error instanceof ApiRequestError ? error.message : 'Pelanggan belum dapat dihapus. Coba lagi.', 'error')
  }
}

function showFeedback(message: string, type: 'success' | 'error' = 'success') {
  feedback.value = { type, message }
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { feedback.value = null }, 4000)
}

watch(() => [meta.value?.total_pages, rows.value.length], ([pages]) => {
  const lastPage = Math.max(1, Number(pages ?? 1))
  if (page.value > lastPage) page.value = lastPage
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (feedbackTimer) clearTimeout(feedbackTimer)
})
</script>

<template>
  <section class="customers-page page-content">
    <ResourcePageHeader eyebrow="DATABASE PELANGGAN" title="Pelanggan" description="Simpan dan kelola informasi pelanggan untuk setiap transaksi." action-label="Tambah pelanggan" @action="openCreate" />
    <ResourceStats :items="stats" note="Pencarian berdasarkan nama pelanggan" />

    <ResourceTablePanel
      class="customers-card"
      title="Daftar pelanggan"
      description="Informasi pelanggan yang terdaftar di sistem."
      :search="searchInput"
      search-placeholder="Cari nama pelanggan..."
      :loading="customersQuery.isPending.value"
      :error="customersQuery.isError.value"
      error-title="Pelanggan belum dapat dimuat"
      :error-message="customersQuery.error.value instanceof Error ? customersQuery.error.value.message : 'Terjadi gangguan saat mengambil data.'"
      :empty="rows.length === 0"
      :empty-title="search ? 'Pelanggan tidak ditemukan' : 'Belum ada pelanggan'"
      :empty-description="search ? 'Coba kata kunci lain atau hapus pencarian.' : 'Tambahkan pelanggan pertama ke daftar.'"
      empty-icon="users"
      item-label="pelanggan"
      :total="meta?.total ?? 0"
      :page="page"
      :per-page="perPage"
      :total-pages="totalPages"
      @update:search="searchInput = $event"
      @update:page="page = $event"
      @retry="customersQuery.refetch()"
    >
      <template #empty-action>
        <button v-if="!search" class="secondary-action" @click="openCreate"><AppIcon name="plus" :size="14" /> Tambah pelanggan</button>
      </template>
      <template #table>
        <table class="products-table customers-table">
          <thead><tr><th>NAMA PELANGGAN</th><th>GENDER</th><th>TANGGAL LAHIR</th><th>NO. HP</th><th>ALAMAT</th><th class="actions-column">AKSI</th></tr></thead>
          <tbody>
            <tr v-for="customer in rows" :key="customer.id">
              <td><button class="customer-name-button" @click="openDetail(customer)"><span class="customer-avatar" :class="`customer-color-${customer.gender === 'Pria' ? 0 : 1}`">{{ initials(customer.customer_name) }}</span><span class="customer-name-text"><strong>{{ customer.customer_name }}</strong><small>{{ customer.id.slice(0, 8) }}…</small></span></button></td>
              <td><span class="gender-pill" :class="customer.gender === 'Pria' ? 'gender-male' : 'gender-female'"><i />{{ customer.gender }}</span></td>
              <td class="customer-date">{{ formatDate(customer.birth_date) }}</td>
              <td class="customer-phone">{{ customer.phone || '—' }}</td>
              <td><span class="customer-address" :title="customer.customer_address">{{ customer.customer_address }}</span></td>
              <td><div class="row-actions"><button class="row-action" title="Detail pelanggan" aria-label="Detail pelanggan" @click="openDetail(customer)"><AppIcon name="eye" :size="15" /></button><button class="row-action" title="Edit pelanggan" aria-label="Edit pelanggan" @click="openEdit(customer)"><AppIcon name="edit" :size="15" /></button><button class="row-action danger" title="Hapus pelanggan" aria-label="Hapus pelanggan" @click="openDelete(customer)"><AppIcon name="trash" :size="15" /></button></div></td>
            </tr>
          </tbody>
        </table>
      </template>
    </ResourceTablePanel>
    <div class="products-footnote"><AppIcon name="check" :size="13" /> Data pelanggan yang dihapus dikeluarkan dari daftar aktif.</div>

    <Transition name="modal-fade">
      <div v-if="dialog === 'create' || dialog === 'edit'" class="dialog-backdrop" @click.self="closeDialog">
        <form class="product-dialog customer-dialog" aria-labelledby="customer-form-title" @submit.prevent="submitForm">
          <div class="dialog-header"><div><span class="dialog-kicker">DATABASE PELANGGAN</span><h2 id="customer-form-title">{{ dialog === 'create' ? 'Tambah pelanggan' : 'Edit pelanggan' }}</h2><p>Lengkapi informasi pelanggan di bawah ini.</p></div><button type="button" class="dialog-close" aria-label="Tutup" @click="closeDialog"><AppIcon name="close" /></button></div>
          <div v-if="formError" class="form-server-error" role="alert"><AppIcon name="warning" :size="15" /> {{ formError }}</div>
          <div class="form-grid">
            <label class="form-field"><span>Nama lengkap <b>*</b></span><input v-model="form.customer_name" maxlength="150" placeholder="Nama pelanggan" autocomplete="name" /><small v-if="formErrors.customer_name" class="field-error">{{ formErrors.customer_name }}</small></label>
            <label class="form-field"><span>Gender <b>*</b></span><select v-model="form.gender"><option value="" disabled>Pilih gender</option><option value="Pria">Pria</option><option value="Wanita">Wanita</option></select><small v-if="formErrors.gender" class="field-error">{{ formErrors.gender }}</small></label>
            <label class="form-field"><span>Tanggal lahir <b>*</b></span><DatePicker v-model="birthDateValue" inputId="customer-birth-date" dateFormat="dd/mm/yy" placeholder="Pilih tanggal lahir" :maxDate="maxBirthDate" :manualInput="true" :showButtonBar="true" :showClear="true" showIcon iconDisplay="input" fluid :invalid="Boolean(formErrors.birth_date)" /><small v-if="formErrors.birth_date" class="field-error">{{ formErrors.birth_date }}</small></label>
            <label class="form-field"><span>Nomor HP</span><input v-model="form.phone" type="tel" maxlength="20" placeholder="Contoh: 081234567890" autocomplete="tel" /><small v-if="formErrors.phone" class="field-error">{{ formErrors.phone }}</small></label>
            <label class="form-field form-field-wide"><span>Alamat <b>*</b></span><textarea v-model="form.customer_address" maxlength="255" rows="3" placeholder="Alamat lengkap pelanggan" autocomplete="street-address" /><small v-if="formErrors.customer_address" class="field-error">{{ formErrors.customer_address }}</small></label>
          </div>
          <div class="dialog-footer"><button type="button" class="secondary-action" @click="closeDialog">Batal</button><button type="submit" class="primary-action" :disabled="saveMutation.isPending.value"><span v-if="saveMutation.isPending.value" class="button-spinner" />{{ saveMutation.isPending.value ? 'Menyimpan…' : dialog === 'create' ? 'Simpan pelanggan' : 'Simpan perubahan' }}</button></div>
        </form>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="dialog === 'detail' && selectedCustomer" class="dialog-backdrop" @click.self="closeDialog">
        <section class="product-dialog detail-dialog customer-detail-dialog" aria-labelledby="customer-detail-title">
          <div class="dialog-header"><div><span class="dialog-kicker">PROFIL PELANGGAN</span><h2 id="customer-detail-title">Detail pelanggan</h2><p>Informasi lengkap pelanggan.</p></div><button class="dialog-close" aria-label="Tutup" @click="closeDialog"><AppIcon name="close" /></button></div>
          <div v-if="detailQuery.isPending.value" class="detail-loading"><span class="loading-spinner" /> Memuat detail pelanggan…</div>
          <div v-else-if="detailQuery.isError.value" class="form-server-error"><AppIcon name="warning" :size="15" /> {{ detailQuery.error.value instanceof Error ? detailQuery.error.value.message : 'Detail pelanggan gagal dimuat.' }}</div>
          <div v-else-if="detailCustomer" class="detail-content"><div class="detail-product-heading"><span class="customer-avatar customer-avatar-large" :class="`customer-color-${detailCustomer.gender === 'Pria' ? 0 : 1}`">{{ initials(detailCustomer.customer_name) }}</span><span><strong>{{ detailCustomer.customer_name }}</strong><small>{{ detailCustomer.gender }} · {{ detailCustomer.id }}</small></span></div><dl><div><dt>Tanggal lahir</dt><dd>{{ formatDate(detailCustomer.birth_date) }}</dd></div><div><dt>Nomor HP</dt><dd>{{ detailCustomer.phone || 'Tidak tersedia' }}</dd></div><div class="detail-wide"><dt>Alamat</dt><dd>{{ detailCustomer.customer_address }}</dd></div><div><dt>Terdaftar</dt><dd>{{ formatDate(detailCustomer.created_at) }}</dd></div><div><dt>Terakhir diperbarui</dt><dd>{{ formatDate(detailCustomer.updated_at) }}</dd></div></dl></div>
          <div class="dialog-footer"><button class="secondary-action" @click="closeDialog">Tutup</button><button v-if="detailCustomer" class="primary-action" @click="openEdit(detailCustomer)"><AppIcon name="edit" :size="14" /> Edit pelanggan</button></div>
        </section>
      </div>
    </Transition>

    <ConfirmDeleteDialog
      v-if="dialog === 'delete' && selectedCustomer"
      entity-label="pelanggan"
      :entity-name="selectedCustomer.customer_name"
      :pending="deleteMutation.isPending.value"
      :error="deleteMutation.error.value instanceof Error ? deleteMutation.error.value.message : ''"
      confirm-label="Ya, hapus pelanggan"
      @close="closeDialog"
      @confirm="confirmDelete"
    >
      akan dikeluarkan dari daftar pelanggan aktif. Riwayat order terkait tetap tersimpan.
    </ConfirmDeleteDialog>

    <FeedbackToast :feedback="feedback" @dismiss="feedback = null" />
  </section>
</template>

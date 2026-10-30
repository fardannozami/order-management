import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import { pinia } from './stores/pinia'
import './style.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createApp(App)
  .use(pinia)
  .use(router)
  .use(VueQueryPlugin, { queryClient })
  .use(PrimeVue, {
    locale: {
      fileSizeTypes: ['B', 'KB', 'MB', 'GB'],
      dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
      dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
      dayNamesMin: ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'],
      monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
      monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      today: 'Hari ini',
      clear: 'Hapus',
      weekHeader: 'Mg',
      firstDayOfWeek: 1,
      dateFormat: 'dd/mm/yy',
      chooseDate: 'Pilih tanggal',
      chooseMonth: 'Pilih bulan',
      chooseYear: 'Pilih tahun',
      prevMonth: 'Bulan sebelumnya',
      nextMonth: 'Bulan berikutnya',
      prevYear: 'Tahun sebelumnya',
      nextYear: 'Tahun berikutnya',
    },
    theme: {
      preset: Aura,
      options: { darkModeSelector: '[data-theme="dark"]' },
    },
  })
  .mount('#app')

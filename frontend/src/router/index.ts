import { createRouter, createWebHistory } from 'vue-router'
import PlaceholderView from '../views/PlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/login',
      name: 'login',
      component: PlaceholderView,
      meta: { title: 'Login', description: 'Masuk ke akun untuk mengelola order.' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: PlaceholderView,
      meta: { title: 'Dashboard', description: 'Ringkasan transaksi, produk terlaris, dan stok menipis.' },
    },
    {
      path: '/products',
      name: 'products',
      component: PlaceholderView,
      meta: { title: 'Produk', description: 'Daftar, pencarian, dan pengelolaan produk.' },
    },
    {
      path: '/customers',
      name: 'customers',
      component: PlaceholderView,
      meta: { title: 'Pelanggan', description: 'Daftar dan pengelolaan data pelanggan.' },
    },
    {
      path: '/orders',
      name: 'orders',
      component: PlaceholderView,
      meta: { title: 'Order', description: 'Buat order dan lihat riwayat transaksi.' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

export default router

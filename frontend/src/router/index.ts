import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores/pinia'
import DashboardView from '../views/DashboardView.vue'
import CustomersView from '../views/CustomersView.vue'
import ProductsView from '../views/ProductsView.vue'
import OrdersView from '../views/OrdersView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      meta: { title: 'Beranda', public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: PlaceholderView,
      meta: { title: 'Login', description: 'Masuk ke akun untuk mengelola order.', public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard', description: 'Ringkasan transaksi, produk terlaris, dan stok menipis.', requiresAuth: true },
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { title: 'Produk', description: 'Daftar, pencarian, dan pengelolaan produk.', requiresAuth: true },
    },
    {
      path: '/customers',
      name: 'customers',
      component: CustomersView,
      meta: { title: 'Pelanggan', description: 'Daftar dan pengelolaan data pelanggan.', requiresAuth: true },
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrdersView,
      meta: { title: 'Order', description: 'Buat order dan lihat riwayat transaksi.', requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  if (to.meta.requiresAuth && !(await auth.restoreSession())) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && await auth.restoreSession()) {
    return { name: 'dashboard' }
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import SharedReport from '../views/SharedReport.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/crash/:shareId',
    name: 'SharedReport',
    component: SharedReport,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

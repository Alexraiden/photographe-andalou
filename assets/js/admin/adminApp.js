/**
 * Admin Application Bootstrap
 *
 * Registers admin routes and auth guard.
 */

import { adminAuth } from './authService.js';
import { LoginPage } from './pages/loginPage.js';
import { DashboardPage } from './pages/dashboardPage.js';
import { PhotosPage } from './pages/photosPage.js';
import { CollectionsPage } from './pages/collectionsPage.js';

export function registerAdminRoutes(router) {
  // Auth guard: redirect to login if not authenticated
  const originalHook = router.beforeNavigateHook;

  router.setBeforeNavigate(async (newRoute, oldRoute) => {
    // Call original hook first
    if (originalHook) {
      const result = await originalHook(newRoute, oldRoute);
      if (!result) return false;
    }

    // Check admin routes (except login)
    if (newRoute.startsWith('/admin') && newRoute !== '/admin/login') {
      if (!adminAuth.isAuthenticated()) {
        window.location.hash = '#/admin/login';
        return false;
      }
    }

    // If already authenticated and going to login, redirect to dashboard
    if (newRoute === '/admin/login' && adminAuth.isAuthenticated()) {
      window.location.hash = '#/admin';
      return false;
    }

    return true;
  });

  // Register routes
  router.register('/admin/login', LoginPage);
  router.register('/admin', DashboardPage);
  router.register('/admin/photos', PhotosPage);
  router.register('/admin/collections', CollectionsPage);
}

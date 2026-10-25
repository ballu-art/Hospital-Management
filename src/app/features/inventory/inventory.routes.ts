import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    title: 'Stock items',
    loadComponent: () => import('./pages/stock-items.page').then((m) => m.StockItemsPage),
  },
  {
    path: 'suppliers',
    title: 'Suppliers',
    data: { breadcrumb: 'Suppliers' },
    loadComponent: () => import('./pages/suppliers.page').then((m) => m.SuppliersPage),
  },
  {
    path: 'purchase-orders',
    title: 'Purchase orders',
    data: { breadcrumb: 'Purchase orders' },
    loadComponent: () => import('./pages/purchase-orders.page').then((m) => m.PurchaseOrdersPage),
  },
];

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./feature/auth/auth.routing').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'company',
    loadChildren: () =>
      import('./feature/company/company.routing').then((m) => m.COMPANY_ROUTES),
  },
  {
    path: '**',
    redirectTo: '/auth/login',
  },
];

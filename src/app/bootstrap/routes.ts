import { Routes } from '@angular/router';

export const routePaths = {
  sandbox: 'sandbox',
  recipeAlternatives: 'recipe-alternatives',
};

export const routes: Routes = [
  {
    title: 'Sandbox',
    path: routePaths.sandbox,
    loadComponent: () => import('@app/page/sandbox/sandbox/sandbox'),
  },

  {
    title: 'Factorio Rocket Capacitator',
    path: routePaths.recipeAlternatives,
    loadComponent: () => import('@app/page/sandbox/sandbox/sandbox'),
  },

  {
    path: '**',
    redirectTo: routePaths.sandbox,
  },
];

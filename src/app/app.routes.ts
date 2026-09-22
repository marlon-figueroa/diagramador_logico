import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
        title: 'Índice · Diagramador lógico',
      },
      {
        path: 'compuertas',
        loadComponent: () => import('./pages/gates/gates').then((m) => m.GatesPage),
        title: 'Compuertas lógicas',
      },
      {
        path: 'karnaugh',
        loadComponent: () => import('./pages/karnaugh/karnaugh').then((m) => m.KarnaughPage),
        title: 'Mapas de Karnaugh',
      },
      {
        path: 'msi',
        loadComponent: () => import('./pages/msi/msi').then((m) => m.MsiPage),
        title: 'Circuitos MSI',
      },
      {
        path: 'componentes',
        loadComponent: () => import('./pages/componentes/componentes').then((m) => m.ComponentesPage),
        title: 'Decodificador y multiplexor',
      },
      {
        path: 'flip-flops',
        loadComponent: () => import('./pages/flipflops/flipflops').then((m) => m.FlipflopsPage),
        title: 'Flip-flops',
      },
      {
        path: 'ayuda',
        loadComponent: () => import('./pages/ayuda/ayuda').then((m) => m.AyudaPage),
        title: 'Ayuda · Diagramador lógico',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

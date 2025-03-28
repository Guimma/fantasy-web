import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'times',
    loadComponent: () => import('./features/times').then(m => m.TimesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'draft',
    loadComponent: () => import('./features/draft/draft.component').then(m => m.DraftComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'mercado',
    loadComponent: () => import('./features/mercado').then(m => m.MercadoComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'meu-time',
    loadChildren: () => import('./features/my-team/my-team.module').then(m => m.MyTeamModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'ligas',
    loadChildren: () => import('./features/ligas/ligas.module').then(m => m.LigasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'times',
    loadChildren: () => import('./features/times/times.module').then(m => m.TimesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'draft',
    loadChildren: () => import('./features/draft/draft.module').then(m => m.DraftModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'mercado',
    loadChildren: () => import('./features/mercado/mercado.module').then(m => m.MercadoModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'ligas',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
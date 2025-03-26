import { Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { authAdminGuard } from './core/guards/auth.admin.guard';
import { teamGuard } from './core/guards/team.guard';
import { AccessDeniedComponent } from './features/access-denied/access-denied.component';
import { AuthDebugComponent } from './features/auth-debug/auth-debug.component';
import { TeamCreationComponent } from './features/team-creation/team-creation.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [teamGuard] },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: 'auth-debug', component: AuthDebugComponent },
  { path: 'create-team', component: TeamCreationComponent, canActivate: [authGuard] },
  {
    path: 'draft',
    loadComponent: () => import('./features/draft/draft.component').then(m => m.DraftComponent),
    canActivate: [authGuard, adminGuard]
  },
  { path: '**', redirectTo: '/home' }
];

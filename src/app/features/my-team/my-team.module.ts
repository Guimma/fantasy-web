import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Services
import { MyTeamService } from './services/my-team.service';

const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./my-team.component').then(m => m.MyTeamComponent) 
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  providers: [
    MyTeamService
  ]
})
export class MyTeamModule { } 
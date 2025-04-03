import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Services
import { MyTeamService } from './services/my-team.service';
import { PontuacaoService } from './services/pontuacao.service';

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
    MyTeamService,
    PontuacaoService
  ]
})
export class MyTeamModule { } 
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Services
import { MyTeamService } from './services/my-team.service';
import { PontuacaoService } from './services/pontuacao.service';
import { TeamHistoryService } from './services/team-history.service';

const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./my-team.component').then(m => m.MyTeamComponent) 
  },
  {
    path: 'historico',
    loadComponent: () => import('./components/team-history/team-history.component').then(m => m.TeamHistoryComponent)
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  providers: [
    MyTeamService,
    PontuacaoService,
    TeamHistoryService
  ]
})
export class MyTeamModule { } 
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MaterialModule } from '../../material.module';
import { LigasListComponent } from './ligas-list/ligas-list.component';
import { LigaDetailComponent } from './liga-detail/liga-detail.component';
import { LigaFormComponent } from './liga-form/liga-form.component';

const routes: Routes = [
  {
    path: '',
    component: LigasListComponent
  },
  {
    path: 'nova',
    component: LigaFormComponent
  },
  {
    path: ':id',
    component: LigaDetailComponent
  }
];

@NgModule({
  declarations: [
    LigasListComponent,
    LigaDetailComponent,
    LigaFormComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MaterialModule,
    RouterModule.forChild(routes)
  ]
})
export class LigasModule { } 
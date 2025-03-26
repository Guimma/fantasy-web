import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-ligas-list',
  template: `
    <div class="container">
      <div class="header">
        <h1>Ligas</h1>
        <button mat-raised-button color="primary" (click)="novaLiga()">
          <mat-icon>add</mat-icon>
          Nova Liga
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="dataSource" matSort>
            <!-- Nome Column -->
            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Nome </th>
              <td mat-cell *matCellDef="let row"> {{row.nome}} </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
              <td mat-cell *matCellDef="let row">
                <mat-chip-list>
                  <mat-chip [color]="row.status === 'ativa' ? 'primary' : 'warn'" selected>
                    {{row.status}}
                  </mat-chip>
                </mat-chip-list>
              </td>
            </ng-container>

            <!-- Times Column -->
            <ng-container matColumnDef="times">
              <th mat-header-cell *matHeaderCellDef> Times </th>
              <td mat-cell *matCellDef="let row"> {{row.times}}/{{row.maxTimes}} </td>
            </ng-container>

            <!-- Ações Column -->
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef> Ações </th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="verDetalhes(row)">
                    <mat-icon>visibility</mat-icon>
                    <span>Ver Detalhes</span>
                  </button>
                  <button mat-menu-item (click)="editarLiga(row)">
                    <mat-icon>edit</mat-icon>
                    <span>Editar</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]"></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
    }
    .mat-column-acoes {
      width: 100px;
      text-align: center;
    }
  `]
})
export class LigasListComponent implements OnInit {
  displayedColumns: string[] = ['nome', 'status', 'times', 'acoes'];
  dataSource: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private router: Router) {
    this.dataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    // TODO: Implementar chamada à API para buscar ligas
    this.dataSource.data = [
      {
        id: 1,
        nome: 'Liga Brasileira 2024',
        status: 'ativa',
        times: 8,
        maxTimes: 12
      }
    ];
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  novaLiga() {
    this.router.navigate(['/ligas/nova']);
  }

  verDetalhes(liga: any) {
    this.router.navigate(['/ligas', liga.id]);
  }

  editarLiga(liga: any) {
    this.router.navigate(['/ligas', liga.id, 'editar']);
  }
} 
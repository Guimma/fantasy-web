import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  constructor(private router: Router) {}

  navigate(commands: any[], extras?: any): Promise<boolean> {
    return this.router.navigate(commands, extras);
  }

  navigateByUrl(url: string, extras?: any): Promise<boolean> {
    return this.router.navigateByUrl(url, extras);
  }

  getCurrentRoute(): any {
    return this.router.routerState.root;
  }

  getRouteData(): any {
    return this.getCurrentRoute().snapshot.data;
  }

  getBreadcrumbs(): any[] {
    return this.getRouteData().breadcrumbs || [];
  }

  getPageTitle(): string {
    return this.getRouteData().title || '';
  }

  getRequiredPermissions(): string[] {
    return this.getRouteData().permissions || [];
  }

  getRequiredRoles(): string[] {
    return this.getRouteData().roles || [];
  }

  getCurrentUrl(): string {
    return this.router.url;
  }

  getQueryParams(): any {
    return this.getCurrentRoute().snapshot.queryParams;
  }

  getRouteParams(): any {
    return this.getCurrentRoute().snapshot.params;
  }

  getParentRoute(): any {
    return this.getCurrentRoute().parent;
  }

  getChildRoute(): any {
    return this.getCurrentRoute().firstChild;
  }

  hasChildRoute(): boolean {
    return !!this.getChildRoute();
  }

  isChildRoute(): boolean {
    return !!this.getParentRoute();
  }

  onNavigationEnd(): any {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    );
  }
} 
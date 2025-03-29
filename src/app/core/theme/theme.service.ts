import { Injectable } from '@angular/core';

export interface ThemeColors {
  raisin: string; // #2d2a32
  citrine: string; // #ddd92a 
  maize: string; // #eae151
  vanilla: string; // #eeefa8
  babypowder: string; // #fafdf6
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private defaultTheme: ThemeColors = {
    raisin: '#2d2a32',
    citrine: '#ddd92a',
    maize: '#eae151',
    vanilla: '#eeefa8',
    babypowder: '#fafdf6'
  };

  constructor() { }

  /**
   * Get the primary color (raisin black)
   */
  getPrimaryColor(): string {
    return this.defaultTheme.raisin;
  }

  /**
   * Get the accent color (citrine)
   */
  getAccentColor(): string {
    return this.defaultTheme.citrine;
  }

  /**
   * Get the warn color (maize)
   */
  getWarnColor(): string {
    return this.defaultTheme.maize;
  }

  /**
   * Get the light accent color (vanilla)
   */
  getLightAccentColor(): string {
    return this.defaultTheme.vanilla;
  }

  /**
   * Get the background color (baby powder)
   */
  getBackgroundColor(): string {
    return this.defaultTheme.babypowder;
  }

  /**
   * Get all theme colors
   */
  getAllColors(): ThemeColors {
    return { ...this.defaultTheme };
  }
} 
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorMessageService {
  constructor(private languageService: LanguageService) {}

  getErrorMessage(control: AbstractControl): string {
    const errors = this.getValidationErrors(control);
    if (!errors || Object.keys(errors).length === 0) return '';

    const errorKey = Object.keys(errors)[0];
    return this.languageService.translateSync(`errors.${errorKey}`);
  }

  getValidationErrors(control: AbstractControl): ValidationErrors | null {
    return control.errors;
  }

  getFormErrors(form: AbstractControl): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
    if (form instanceof AbstractControl) {
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        if (control) {
          const error = this.getErrorMessage(control);
          if (error) {
            errors[key] = error;
          }
        }
      });
    }
    return errors;
  }

  hasError(control: AbstractControl, errorType: string): boolean {
    return control.hasError(errorType);
  }

  hasAnyError(control: AbstractControl, errorTypes: string[]): boolean {
    return errorTypes.some(type => this.hasError(control, type));
  }

  hasAllErrors(control: AbstractControl, errorTypes: string[]): boolean {
    return errorTypes.every(type => this.hasError(control, type));
  }

  isFieldValid(control: AbstractControl): boolean {
    return control.valid && (control.dirty || control.touched);
  }

  isFieldInvalid(control: AbstractControl): boolean {
    return control.invalid && (control.dirty || control.touched);
  }
} 
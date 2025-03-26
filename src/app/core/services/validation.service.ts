import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  // Validação de email
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const valid = emailRegex.test(control.value);
      return valid ? null : { email: true };
    };
  }

  // Validação de senha
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]+/.test(value);
      const hasMinLength = value.length >= 8;

      const errors: ValidationErrors = {};
      if (!hasUpperCase) errors['uppercase'] = true;
      if (!hasLowerCase) errors['lowercase'] = true;
      if (!hasNumeric) errors['numeric'] = true;
      if (!hasSpecialChar) errors['special'] = true;
      if (!hasMinLength) errors['minlength'] = true;

      return Object.keys(errors).length ? errors : null;
    };
  }

  // Validação de confirmação de senha
  passwordMatchValidator(passwordControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = passwordControl.value;
      const confirmPassword = control.value;
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  // Validação de CPF
  cpfValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cpf = control.value?.replace(/\D/g, '');
      if (!cpf || cpf.length !== 11) return { cpf: true };

      // Check for repeated digits
      if (/^(\d)\1+$/.test(cpf)) return { cpf: true };

      // Validate first digit
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      let digit = 11 - (sum % 11);
      if (digit > 9) digit = 0;
      if (digit !== parseInt(cpf.charAt(9))) return { cpf: true };

      // Validate second digit
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      digit = 11 - (sum % 11);
      if (digit > 9) digit = 0;
      if (digit !== parseInt(cpf.charAt(10))) return { cpf: true };

      return null;
    };
  }

  // Validação de telefone
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
      const valid = phoneRegex.test(control.value);
      return valid ? null : { phone: true };
    };
  }

  // Validação de data
  dateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = new Date(control.value);
      const valid = date instanceof Date && !isNaN(date.getTime());
      return valid ? null : { date: true };
    };
  }

  // Validação de número positivo
  positiveNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined) return null;
      return value > 0 ? null : { positive: true };
    };
  }

  // Validação de número inteiro
  integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined) return null;
      return Number.isInteger(value) ? null : { integer: true };
    };
  }

  // Validação de URL
  urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: true };
      }
    };
  }

  // Validação de tamanho mínimo
  minLengthValidator(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      return value.length >= minLength ? null : { minlength: true };
    };
  }

  // Validação de tamanho máximo
  maxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      return value.length <= maxLength ? null : { maxlength: true };
    };
  }
} 